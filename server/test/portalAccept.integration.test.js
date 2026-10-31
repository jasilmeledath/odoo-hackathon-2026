// Real HTTP acceptance regressions, including concurrent ownership changes (PS-27).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { after, afterEach, test } from 'node:test';
import express from 'express';

if (!process.env.TEST_DATABASE_URL)
  throw new Error('Set TEST_DATABASE_URL to an isolated migrated and seeded database');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { prisma } = await import('../src/lib/prisma.js');
const { today, addDays } = await import('../src/lib/dates.js');
const { default: portalRoutes } = await import('../src/modules/portal/portal.routes.js');
const { default: authRoutes } = await import('../src/modules/auth/auth.routes.js');
const { errorHandler } = await import('../src/middleware/error.js');
const { transitionSubscription } = await import('../src/modules/subscriptions/subscriptions.service.js');
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/portal', portalRoutes);
app.use(errorHandler);
const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
async function login(email) {
  const response = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Demo@12345' }),
  });
  assert.equal(response.status, 200);
  return response.json();
}
const customer = await login('customer@demo.test');
const other = await login('customer2@demo.test');
const admin = await login('admin@demo.test');
const staff = await login('staff@demo.test');
const fixtureIds = [];
const reference = await prisma.subscription.findFirstOrThrow({ include: { lines: true } });
async function createQuotation(overrides = {}) {
  const subscription = await prisma.subscription.create({
    data: {
      number: 'AC-' + randomUUID().slice(0, 12),
      customerId: customer.user.customerId,
      planId: reference.planId,
      paymentTermId: reference.paymentTermId,
      status: 'QUOTATION',
      startDate: today(),
      expiryDate: addDays(today(), 365),
      quotationExpiryDate: addDays(today(), 7),
      recurringAmount: 10000,
      monthlyRecurringAmount: 10000,
      lines: {
        create: { productId: reference.lines[0].productId, quantity: 1, unitPrice: 10000, amount: 10000 },
      },
      ...overrides,
    },
  });
  fixtureIds.push(subscription.id);
  return subscription;
}
async function accept(id, token = customer.token, body = {}) {
  const response = await fetch(base + '/api/portal/subscriptions/' + id + '/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
afterEach(async () => {
  await prisma.subscription.deleteMany({ where: { id: { in: fixtureIds } } });
  fixtureIds.length = 0;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

test('acceptance confirms an owned quotation and records one customer activity without leaking staff fields', async () => {
  const subscription = await createQuotation();
  const result = await accept(subscription.id);
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'CONFIRMED');
  assert.equal(result.body.recurringAmount, 10000);
  assert.equal(result.body.lines.length, 1);
  for (const field of ['customer', 'customerId', 'paymentTerm', 'passwordHash', 'costPrice'])
    assert.equal(Object.hasOwn(result.body, field), false);
  const activity = await prisma.activityLog.findMany({ where: { subscriptionId: subscription.id } });
  assert.equal(activity.length, 1);
  assert.equal(activity[0].action, 'STATUS_CHANGED');
  assert.equal(activity[0].actorId, customer.user.id);
  assert.equal(await prisma.invoice.count({ where: { subscriptionId: subscription.id } }), 0);
});
test('expired quotations are refused without a mutation; expiry today is inclusive', async () => {
  const expired = await createQuotation({ quotationExpiryDate: addDays(today(), -1) });
  const denied = await accept(expired.id);
  assert.equal(denied.status, 409);
  assert.match(denied.body.error, /expired/);
  assert.equal((await prisma.subscription.findUnique({ where: { id: expired.id } })).status, 'QUOTATION');
  assert.equal(await prisma.activityLog.count({ where: { subscriptionId: expired.id } }), 0);
  const valid = await createQuotation({ quotationExpiryDate: today() });
  assert.equal((await accept(valid.id)).status, 200);
});
test('other customers and missing records receive the same 404', async () => {
  const subscription = await createQuotation({ customerId: other.user.customerId });
  assert.deepEqual(await accept(subscription.id), await accept(2147483647));
  assert.equal((await accept(subscription.id)).status, 404);
});
test('auth, role, ID and body guards reject unauthorized input', async () => {
  const subscription = await createQuotation();
  assert.equal((await accept(subscription.id, null)).status, 401);
  for (const token of [admin.token, staff.token])
    assert.equal((await accept(subscription.id, token)).status, 403);
  for (const id of ['bad', 0, 2147483648]) assert.equal((await accept(id)).status, 400);
  assert.equal(
    (await accept(subscription.id, customer.token, { customerId: other.user.customerId, status: 'ACTIVE' }))
      .status,
    400,
  );
});
test('invalid current states are refused and concurrent acceptance records only once', async () => {
  for (const status of ['DRAFT', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED']) {
    const subscription = await createQuotation({
      status,
      ...(status === 'CLOSED' ? { closedAt: new Date() } : {}),
    });
    assert.equal((await accept(subscription.id)).status, 409);
  }
  const subscription = await createQuotation();
  const results = await Promise.all([accept(subscription.id), accept(subscription.id)]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal(await prisma.activityLog.count({ where: { subscriptionId: subscription.id } }), 1);
});
test('a concurrent committed ownership transfer prevents acceptance', async () => {
  const subscription = await createQuotation();
  let release;
  let locked;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const ready = new Promise((resolve) => {
    locked = resolve;
  });
  const transfer = prisma.$transaction(
    async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { customerId: other.user.customerId },
      });
      locked();
      await gate;
    },
    { timeout: 15000 },
  );
  await ready;
  const pending = accept(subscription.id);
  try {
    const deadline = Date.now() + 3000;
    let waiting = false;
    while (Date.now() < deadline) {
      const [row] =
        await prisma.$queryRaw`SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`;
      if (row.count > 0) {
        waiting = true;
        break;
      }
      await delay(10);
    }
    assert.ok(waiting, 'the competing action must wait for the ownership transaction');
  } finally {
    release();
    await transfer;
  }
  assert.equal((await pending).status, 404);
  assert.equal(
    (await prisma.subscription.findUnique({ where: { id: subscription.id } })).status,
    'QUOTATION',
  );
  assert.equal(await prisma.activityLog.count({ where: { subscriptionId: subscription.id } }), 0);
});
test('staff confirmation still uses the same workflow', async () => {
  const subscription = await createQuotation();
  assert.equal((await transitionSubscription(subscription.id, 'CONFIRM', admin.user)).status, 'CONFIRMED');
});
