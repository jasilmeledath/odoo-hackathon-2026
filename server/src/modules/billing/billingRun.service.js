// PS-15: one locked transaction per billing period, processed in bounded batches.
// The database's live-period index remains the final duplicate-billing guard.
import { addDays, addPeriod, today } from '../../lib/dates.js';
import { HttpError } from '../../lib/errors.js';
import { nextNumber } from '../../lib/numbering.js';
import { logActivity } from '../../lib/activity.js';
import { prisma } from '../../lib/prisma.js';
import { calculateInvoice } from './billing.service.js';

const BILLING_BATCH_SIZE = 100;
const MAX_DATABASE_AMOUNT = 2_147_483_647;
const SUBSCRIPTION_INCLUDE = {
  customer: true,
  plan: true,
  paymentTerm: true,
  lines: {
    where: { isActive: true },
    include: { product: true, variant: true, tax: true },
    orderBy: { id: 'asc' },
  },
};

export const dueSubscriptionsWhere = (issueDate) => ({
  status: 'ACTIVE',
  nextInvoiceDate: { lte: issueDate },
  // Prisma cannot compare two columns in this object; use its typed field reference.
  expiryDate: { gt: prisma.subscription.fields.nextInvoiceDate },
});

const snapshotLines = (subscription) =>
  subscription.lines.map((line) => ({
    productId: line.productId,
    description: [line.product.name, line.variant?.value].filter(Boolean).join(' — ').slice(0, 200),
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    taxName: line.tax?.name ?? null,
    taxRatePercent: Number(line.tax?.ratePercent ?? 0),
  }));

const isPeriodConflict = (error) =>
  error.code === 'P2002' &&
  (String(error.meta?.target).includes('invoices_one_per_period_key') ||
    (String(error.meta?.target).includes('subscription_id') &&
      String(error.meta?.target).includes('period_start_date')));

// Keep cursor changes here so cancellation can rewind through already billed periods safely.
export const billSubscriptionPeriod = async (tx, id, issueDate, actor = null) => {
  await tx.$queryRaw`SELECT id FROM subscriptions WHERE id = ${id} FOR UPDATE`;
  const subscription = await tx.subscription.findUnique({ where: { id }, include: SUBSCRIPTION_INCLUDE });
  if (!subscription) throw new HttpError(404, 'Subscription not found');
  const periodStartDate = subscription.nextInvoiceDate;
  if (
    subscription.status !== 'ACTIVE' ||
    !periodStartDate ||
    periodStartDate > issueDate ||
    periodStartDate >= subscription.expiryDate
  )
    return null;
  const nextDate = addPeriod(
    periodStartDate,
    subscription.plan.billingPeriod,
    subscription.startDate.getUTCDate(),
  );
  const advance = () =>
    tx.subscription.update({
      where: { id },
      data: {
        nextInvoiceDate: nextDate < subscription.expiryDate ? nextDate : null,
      },
    });
  const existing = await tx.invoice.findFirst({
    where: { subscriptionId: id, periodStartDate, status: { not: 'CANCELED' } },
    select: { id: true },
  });
  if (existing) {
    await advance();
    return 'skipped';
  }
  if (!subscription.lines.length) throw new HttpError(409, 'Add an active subscription line before billing');
  const calculated = calculateInvoice({ lines: snapshotLines(subscription), issueDate });
  if (
    !Number.isSafeInteger(calculated.totalAmount) ||
    calculated.totalAmount > MAX_DATABASE_AMOUNT ||
    calculated.lines.some((line) => line.amount > MAX_DATABASE_AMOUNT)
  ) {
    throw new HttpError(409, 'Invoice amount exceeds the supported limit; reduce the subscription quantity');
  }
  const { lines, ...totals } = calculated;
  const invoice = await tx.invoice.create({
    data: {
      ...totals,
      number: await nextNumber(tx, 'INVOICE'),
      subscriptionId: id,
      customerId: subscription.customerId,
      billingName: subscription.customer.companyName || subscription.customer.name,
      billingAddress: subscription.customer.address,
      issueDate,
      dueDate: addDays(issueDate, subscription.paymentTerm.dueDays),
      periodStartDate,
      periodEndDate: addDays(nextDate, -1),
      lines: { create: lines },
    },
  });
  await advance();
  await logActivity(tx, {
    subscriptionId: id,
    invoiceId: invoice.id,
    action: 'INVOICED',
    detail: `Created invoice ${invoice.number}`,
    actorId: actor?.id ?? null,
  });
  return 'created';
};

export const billSubscription = async (id, { issueDate = today(), actor = null } = {}) => {
  const result = { created: 0, skipped: 0, failed: 0 };
  for (;;) {
    try {
      const outcome = await prisma.$transaction((tx) => billSubscriptionPeriod(tx, id, issueDate, actor));
      if (!outcome) break;
      result[outcome] += 1;
    } catch (error) {
      if (isPeriodConflict(error)) result.skipped += 1;
      else {
        console.error(`Billing failed for subscription ${id}`, error);
        result.failed += 1;
      }
      break;
    }
  }
  return result;
};

export const runBilling = async ({ issueDate = today(), actor = null } = {}) => {
  const result = { created: 0, skipped: 0, failed: 0 };
  let lastId = 0;
  for (;;) {
    const batch = await prisma.subscription.findMany({
      where: { ...dueSubscriptionsWhere(issueDate), id: { gt: lastId } },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: BILLING_BATCH_SIZE,
    });
    if (!batch.length) return result;
    for (const subscription of batch) {
      const counts = await billSubscription(subscription.id, { issueDate, actor });
      for (const key of Object.keys(result)) result[key] += counts[key];
    }
    lastId = batch.at(-1).id;
  }
};
