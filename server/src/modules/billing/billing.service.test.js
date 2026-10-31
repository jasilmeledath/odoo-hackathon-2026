// Tests for calculateInvoice(): the worked example from Implementation Plan §5,
// then each discount rule on its own. Run with `npm test`.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateInvoice } from './billing.service.js';

const ISSUE_DATE = '2026-10-31';

const CRM = { productId: 1, quantity: 10, unitPrice: 176000, taxRatePercent: 18 };
const STORAGE = { productId: 2, quantity: 1, unitPrice: 20000, taxRatePercent: 18 };

const buildDiscount = (overrides = {}) => ({
  id: 1,
  type: 'PERCENT',
  percent: 10,
  fixedAmount: null,
  scope: 'SUBSCRIPTION',
  minPurchaseAmount: 0,
  minQuantity: 0,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  usageLimit: null,
  usageCount: 0,
  isActive: true,
  productIds: [],
  ...overrides,
});

const calculate = (lines, discounts = []) => calculateInvoice({ lines, discounts, issueDate: ISSUE_DATE });

describe('calculateInvoice', () => {
  it('gives ₹18,903.60 for the worked example', () => {
    const result = calculate([CRM, STORAGE], [buildDiscount()]);
    assert.equal(result.subtotalAmount, 1780000);
    assert.equal(result.discountAmount, 178000);
    assert.equal(result.taxAmount, 288360);
    assert.equal(result.totalAmount, 1890360);
    assert.deepEqual(
      result.lines.map((line) => [line.amount, line.discountAmount, line.taxAmount]),
      [
        [1760000, 176000, 285120],
        [20000, 2000, 3240],
      ],
    );
    assert.equal(result.discountId, 1);
  });

  it('charges tax on the full amount when there is no discount', () => {
    const result = calculate([CRM, STORAGE]);
    assert.equal(result.discountAmount, 0);
    assert.equal(result.discountId, null);
    assert.equal(result.taxAmount, 320400);
    assert.equal(result.totalAmount, 2100400);
  });

  it('charges no tax on a line without a rate', () => {
    const result = calculate([{ productId: 3, quantity: 2, unitPrice: 5000 }]);
    assert.equal(result.taxAmount, 0);
    assert.equal(result.totalAmount, 10000);
  });

  it('applies a PRODUCT discount to the listed products only', () => {
    const result = calculate([CRM, STORAGE], [buildDiscount({ scope: 'PRODUCT', productIds: [2] })]);
    assert.deepEqual(
      result.lines.map((line) => line.discountAmount),
      [0, 2000],
    );
    assert.equal(result.discountAmount, 2000);
  });

  it('ignores a PRODUCT discount when no line matches', () => {
    const result = calculate([CRM], [buildDiscount({ scope: 'PRODUCT', productIds: [99] })]);
    assert.equal(result.discountId, null);
    assert.equal(result.discountAmount, 0);
  });

  it('picks the discount that saves the most, and only one (A-11)', () => {
    const small = buildDiscount({ id: 1, percent: 5 });
    const large = buildDiscount({ id: 2, type: 'FIXED', fixedAmount: 500000, percent: null });
    const result = calculate([CRM, STORAGE], [small, large]);
    assert.equal(result.discountId, 2);
    assert.equal(result.discountAmount, 500000);
  });

  it('breaks a tie by the lower discount id', () => {
    const result = calculate([CRM], [buildDiscount({ id: 7 }), buildDiscount({ id: 3 })]);
    assert.equal(result.discountId, 3);
  });

  it('caps a fixed discount at the eligible amount', () => {
    const result = calculate(
      [STORAGE],
      [buildDiscount({ type: 'FIXED', fixedAmount: 999999, percent: null })],
    );
    assert.equal(result.discountAmount, 20000);
    assert.equal(result.taxAmount, 0);
    assert.equal(result.totalAmount, 0);
  });

  it('shares the saving exactly, with the remainder on the last line', () => {
    const lines = [1, 2, 3].map((productId) => ({ productId, quantity: 1, unitPrice: 3333 }));
    const result = calculate(lines, [buildDiscount({ type: 'FIXED', fixedAmount: 1000, percent: null })]);
    assert.deepEqual(
      result.lines.map((line) => line.discountAmount),
      [333, 333, 334],
    );
    assert.equal(result.discountAmount, 1000);
  });

  it('charges tax after the discount (A-12)', () => {
    const result = calculate(
      [{ productId: 1, quantity: 1, unitPrice: 100000, taxRatePercent: 18 }],
      [buildDiscount({ percent: 50 })],
    );
    assert.equal(result.taxAmount, 9000);
    assert.equal(result.totalAmount, 59000);
  });

  describe('discounts that do not apply', () => {
    const cases = {
      inactive: { isActive: false },
      'not started yet': { startDate: '2026-11-01' },
      'already ended': { endDate: '2026-10-30' },
      'used up': { usageLimit: 5, usageCount: 5 },
      'below the minimum purchase': { minPurchaseAmount: 5000000 },
      'below the minimum quantity': { minQuantity: 50 },
    };
    for (const [name, overrides] of Object.entries(cases)) {
      it(`ignores a discount that is ${name}`, () => {
        const result = calculate([CRM, STORAGE], [buildDiscount(overrides)]);
        assert.equal(result.discountId, null);
        assert.equal(result.totalAmount, 2100400);
      });
    }

    it('still applies on the first and last day of its dates', () => {
      assert.equal(calculate([CRM], [buildDiscount({ startDate: ISSUE_DATE })]).discountId, 1);
      assert.equal(calculate([CRM], [buildDiscount({ endDate: ISSUE_DATE })]).discountId, 1);
    });

    it('applies when it has one use left', () => {
      assert.equal(calculate([CRM], [buildDiscount({ usageLimit: 5, usageCount: 4 })]).discountId, 1);
    });
  });

  it('measures the minimums on the eligible lines only', () => {
    const rule = buildDiscount({ scope: 'PRODUCT', productIds: [2], minQuantity: 5 });
    assert.equal(calculate([CRM, STORAGE], [rule]).discountId, null);
  });
});
