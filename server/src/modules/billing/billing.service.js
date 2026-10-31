// Billing rules (PS-16, PS-20). calculateInvoice() is pure: plain data in, totals
// out, no database, so the money rules can be tested on their own.
// All amounts are whole paise. See Implementation Plan §5 for the steps.
import { toDateOnly, toIsoDate } from '../../lib/dates.js';
import { applyPercent } from '../../lib/money.js';

// Compare calendar days as YYYY-MM-DD text, so time zones cannot shift a date.
const toIsoDay = (value) => toIsoDate(toDateOnly(value));

// PS-20: a discount applies when it is active, the issue date is inside its dates and it has uses left.
const isUsable = (discount, issueDay) =>
  discount.isActive &&
  toIsoDay(discount.startDate) <= issueDay &&
  issueDay <= toIsoDay(discount.endDate) &&
  (discount.usageLimit == null || discount.usageCount < discount.usageLimit);

// The lines a discount covers: everything for SUBSCRIPTION scope, listed products for PRODUCT scope.
const eligibleLineIndexes = (discount, lines) => {
  if (discount.scope === 'SUBSCRIPTION') return lines.map((_, index) => index);
  const productIds = new Set(discount.productIds ?? []);
  return lines.flatMap((line, index) => (productIds.has(line.productId) ? [index] : []));
};

// Returns { discount, indexes, saving } for one discount, or null when it does not apply.
const evaluateDiscount = (discount, lines, issueDay) => {
  if (!isUsable(discount, issueDay)) return null;
  const indexes = eligibleLineIndexes(discount, lines);
  const eligibleAmount = indexes.reduce((sum, index) => sum + lines[index].amount, 0);
  const eligibleQuantity = indexes.reduce((sum, index) => sum + lines[index].quantity, 0);
  if (eligibleAmount === 0) return null;
  if (eligibleAmount < discount.minPurchaseAmount || eligibleQuantity < discount.minQuantity) return null;
  const wanted =
    discount.type === 'FIXED' ? discount.fixedAmount : applyPercent(eligibleAmount, Number(discount.percent));
  const saving = Math.min(wanted, eligibleAmount);
  return saving > 0 ? { discount, indexes, saving } : null;
};

// A-11: the discount that saves the customer the most wins, and an invoice gets one.
// On a tie the lower id wins, so the result never depends on input order.
const pickBestDiscount = (discounts, lines, issueDay) =>
  discounts
    .map((discount) => evaluateDiscount(discount, lines, issueDay))
    .filter(Boolean)
    .sort((first, second) => second.saving - first.saving || first.discount.id - second.discount.id)[0] ??
  null;

// Split the saving across the eligible lines in proportion to their amounts. Every
// line but the last is rounded down, and the last takes the remainder, so the
// shares add up to the saving exactly.
const shareSaving = (lines, { indexes, saving }) => {
  const shares = new Array(lines.length).fill(0);
  const eligibleAmount = indexes.reduce((sum, index) => sum + lines[index].amount, 0);
  let given = 0;
  indexes.slice(0, -1).forEach((index) => {
    shares[index] = Math.floor((saving * lines[index].amount) / eligibleAmount);
    given += shares[index];
  });
  shares[indexes.at(-1)] = saving - given;
  return shares;
};

/**
 * PS-16: invoice totals with tax. PS-20: discounts.
 * @param {object} input
 * @param {{ productId: number, quantity: number, unitPrice: number, taxRatePercent?: number }[]} input.lines
 * @param {object[]} input.discounts Candidate discounts with `productIds` for PRODUCT scope.
 * @param {Date|string} input.issueDate Decides whether a discount is within its dates.
 * @returns {{ subtotalAmount, discountAmount, taxAmount, totalAmount, discountId, lines }}
 */
export const calculateInvoice = ({ lines, discounts = [], issueDate }) => {
  const priced = lines.map((line) => ({ ...line, amount: line.quantity * line.unitPrice }));
  const subtotalAmount = priced.reduce((sum, line) => sum + line.amount, 0);

  const bestMatch = pickBestDiscount(discounts, priced, toIsoDay(issueDate));
  const shares = bestMatch ? shareSaving(priced, bestMatch) : priced.map(() => 0);

  const resultLines = priced.map((line, index) => {
    const discountAmount = shares[index];
    // A-12: tax is charged after the discount.
    const taxAmount = applyPercent(line.amount - discountAmount, Number(line.taxRatePercent ?? 0));
    return { ...line, discountAmount, taxAmount };
  });

  const discountAmount = resultLines.reduce((sum, line) => sum + line.discountAmount, 0);
  const taxAmount = resultLines.reduce((sum, line) => sum + line.taxAmount, 0);
  return {
    subtotalAmount,
    discountAmount,
    taxAmount,
    totalAmount: subtotalAmount - discountAmount + taxAmount,
    discountId: bestMatch ? bestMatch.discount.id : null,
    lines: resultLines,
  };
};
