// Real PostgreSQL regressions for money writes. Use an explicitly isolated test database.
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
if (!process.env.TEST_DATABASE_URL)
  throw new Error('Set TEST_DATABASE_URL to an isolated migrated/seeded PostgreSQL database');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { prisma } = await import('../src/lib/prisma.js');
const { billSubscription, runBilling } = await import('../src/modules/billing/billingRun.service.js');
const day = (value) => new Date(value);
const issueDate = day('2026-10-31');
const fixtures = [];
let sequence = 0;
async function subscription(overrides = {}) {
  const customer = await prisma.customer.findFirst();
  const term = await prisma.paymentTerm.findFirst();
  const product = await prisma.product.findFirst({ include: { tax: true } });
  const plan = await prisma.plan.create({
    data: {
      name: `Billing regression ${process.pid}-${sequence++}`,
      productId: product.id,
      price: 10000,
      billingPeriod: 'MONTHLY',
      minQuantity: 1,
      startDate: day('2026-01-01'),
    },
  });
  const sub = await prisma.subscription.create({
    data: {
      number: `TEST-${process.pid}-${sequence}`,
      customerId: customer.id,
      planId: plan.id,
      paymentTermId: term.id,
      status: 'ACTIVE',
      startDate: day('2026-08-31'),
      expiryDate: day('2027-01-31'),
      nextInvoiceDate: day('2026-08-31'),
      ...overrides,
      lines: {
        create: [
          { productId: product.id, taxId: product.taxId, quantity: 2, unitPrice: 10000, amount: 20000 },
        ],
      },
    },
  });
  fixtures.push({ id: sub.id, planId: plan.id });
  return sub;
}
after(async () => {
  for (const { id, planId } of fixtures) {
    const invoices = await prisma.invoice.findMany({ where: { subscriptionId: id }, select: { id: true } });
    await prisma.payment.deleteMany({ where: { invoiceId: { in: invoices.map((i) => i.id) } } });
    await prisma.invoice.deleteMany({ where: { subscriptionId: id } });
    await prisma.subscription.delete({ where: { id } });
    await prisma.plan.delete({ where: { id: planId } });
  }
  await prisma.$disconnect();
});
test('billing catches up oldest first with anchored month ends, snapshots and no duplicates', async () => {
  const sub = await subscription();
  assert.deepEqual(await billSubscription(sub.id, { issueDate }), { created: 3, skipped: 0, failed: 0 });
  const invoices = await prisma.invoice.findMany({
    where: { subscriptionId: sub.id },
    include: { lines: true },
    orderBy: { id: 'asc' },
  });
  assert.deepEqual(
    invoices.map((i) => i.periodStartDate.toISOString().slice(0, 10)),
    ['2026-08-31', '2026-09-30', '2026-10-31'],
  );
  assert.equal(invoices[0].periodEndDate.toISOString().slice(0, 10), '2026-09-29');
  assert.equal(invoices[0].lines[0].unitPrice, 10000);
  assert.equal(invoices[0].status, 'DRAFT');
  assert.deepEqual(await billSubscription(sub.id, { issueDate }), { created: 0, skipped: 0, failed: 0 });
  assert.equal(await prisma.activityLog.count({ where: { subscriptionId: sub.id, action: 'INVOICED' } }), 3);
});
test('concurrent runs bill each live period once', async () => {
  const sub = await subscription();
  const results = await Promise.all([
    billSubscription(sub.id, { issueDate }),
    billSubscription(sub.id, { issueDate }),
  ]);
  assert.equal(
    results.reduce((sum, r) => sum + r.created, 0),
    3,
  );
  assert.equal(
    results.reduce((sum, r) => sum + r.failed, 0),
    0,
  );
  assert.equal(await prisma.invoice.count({ where: { subscriptionId: sub.id } }), 3);
});
test('expiry is exclusive and paused/future subscriptions are not billed', async () => {
  for (const overrides of [
    { expiryDate: day('2026-08-31'), startDate: day('2026-08-01') },
    { status: 'PAUSED' },
    { nextInvoiceDate: day('2026-11-01') },
  ]) {
    const sub = await subscription(overrides);
    assert.equal((await billSubscription(sub.id, { issueDate })).created, 0);
  }
});
test('failure rolls back cursor and invoice number without preventing later subscriptions', async () => {
  const broken = await subscription();
  const good = await subscription();
  await prisma.subscriptionLine.updateMany({
    where: { subscriptionId: broken.id },
    data: { isActive: false },
  });
  const counter = await prisma.documentCounter.findUnique({ where: { key: 'INVOICE' } });
  assert.equal((await billSubscription(broken.id, { issueDate })).failed, 1);
  assert.equal((await prisma.documentCounter.findUnique({ where: { key: 'INVOICE' } })).value, counter.value);
  assert.equal(
    (await prisma.subscription.findUnique({ where: { id: broken.id } })).nextInvoiceDate.getTime(),
    broken.nextInvoiceDate.getTime(),
  );
  assert.equal((await billSubscription(good.id, { issueDate })).created, 3);
});
test('rewound cursors skip existing live invoices without skipping missing periods', async () => {
  const sub = await subscription();
  await billSubscription(sub.id, { issueDate });
  await prisma.subscription.update({ where: { id: sub.id }, data: { nextInvoiceDate: sub.nextInvoiceDate } });
  assert.deepEqual(await billSubscription(sub.id, { issueDate }), { created: 0, skipped: 3, failed: 0 });
});

test('simultaneous subscriptions cannot claim the last discount use twice', async () => {
  const first = await subscription({ nextInvoiceDate: issueDate });
  const second = await subscription({ nextInvoiceDate: issueDate });
  const line = await prisma.subscriptionLine.findFirst({ where: { subscriptionId: first.id } });
  const rule = await prisma.discount.create({
    data: {
      name: `Last use ${process.pid}`,
      type: 'PERCENT',
      percent: 100,
      scope: 'PRODUCT',
      startDate: issueDate,
      endDate: issueDate,
      usageLimit: 1,
      products: { create: [{ productId: line.productId }] },
    },
  });
  try {
    const results = await Promise.all([
      billSubscription(first.id, { issueDate }),
      billSubscription(second.id, { issueDate }),
    ]);
    assert.equal(
      results.reduce((sum, r) => sum + r.created, 0),
      2,
    );
    assert.equal(
      results.reduce((sum, r) => sum + r.failed, 0),
      0,
    );
    assert.equal((await prisma.discount.findUnique({ where: { id: rule.id } })).usageCount, 1);
    assert.equal(await prisma.invoice.count({ where: { discountId: rule.id } }), 1);
    const discounted = await prisma.invoice.findFirst({ where: { discountId: rule.id } });
    assert.equal(discounted.discountAmount, 20000);
    assert.equal(discounted.totalAmount, 0);
  } finally {
    await prisma.discount.delete({ where: { id: rule.id } });
  }
});
