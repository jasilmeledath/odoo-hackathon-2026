// Real customer ownership and field-exposure regressions (PS-26, PS-4).
import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import express from 'express';
if (!process.env.TEST_DATABASE_URL)
  throw new Error('Set TEST_DATABASE_URL to an isolated migrated and seeded PostgreSQL database');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { prisma } = await import('../src/lib/prisma.js');
const { default: portalRoutes } = await import('../src/modules/portal/portal.routes.js');
const { default: authRoutes } = await import('../src/modules/auth/auth.routes.js');
const { errorHandler } = await import('../src/middleware/error.js');
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
const first = await login('customer@demo.test');
const second = await login('customer2@demo.test');
const admin = await login('admin@demo.test');
async function get(path, token = first.token) {
  const response = await fetch(base + '/api/portal' + path, {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });
  return { status: response.status, body: await response.json() };
}
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});
test('only customers may use every portal endpoint', async () => {
  for (const path of ['/subscriptions', '/subscriptions/1', '/invoices', '/invoices/1']) {
    assert.equal((await get(path, admin.token)).status, 403);
    assert.equal((await get(path, null)).status, 401);
  }
});
test('lists ignore caller-supplied ownership and remain paginated', async () => {
  for (const [resource, model] of [
    ['subscriptions', prisma.subscription],
    ['invoices', prisma.invoice],
  ]) {
    const result = await get('/' + resource + '?pageSize=1&customerId=' + second.user.customerId);
    assert.equal(result.status, 200);
    assert.ok(result.body.items.length <= 1);
    assert.equal(result.body.total, await model.count({ where: { customerId: first.user.customerId } }));
    for (const item of result.body.items)
      assert.equal((await model.findUnique({ where: { id: item.id } })).customerId, first.user.customerId);
  }
});
test('another customer and nonexistent records receive identical 404 responses', async () => {
  for (const [resource, model] of [
    ['subscriptions', prisma.subscription],
    ['invoices', prisma.invoice],
  ]) {
    const other = await model.findFirst({ where: { customerId: second.user.customerId } });
    assert.ok(other);
    const denied = await get('/' + resource + '/' + other.id);
    const absent = await get('/' + resource + '/2147483647');
    assert.equal(denied.status, 404);
    assert.deepEqual(denied, absent);
  }
});
test('owned details show lines, payments and balance without internal account or cost fields', async () => {
  const subscription = await prisma.subscription.findFirst({ where: { customerId: first.user.customerId } });
  const sub = await get('/subscriptions/' + subscription.id);
  assert.equal(sub.status, 200);
  assert.ok(Array.isArray(sub.body.lines));
  const invoice = await prisma.invoice.findFirst({
    where: { customerId: first.user.customerId },
    include: { payments: true },
  });
  const detail = await get('/invoices/' + invoice.id);
  assert.equal(detail.status, 200);
  assert.ok(Array.isArray(detail.body.lines));
  assert.equal(detail.body.payments.length, invoice.payments.length);
  assert.equal(detail.body.balanceAmount, invoice.totalAmount - invoice.paidAmount);
  for (const body of [sub.body, detail.body])
    for (const field of ['passwordHash', 'costPrice', 'recordedById', 'actorId', 'tokenHash'])
      assert.equal(JSON.stringify(body).includes('"' + field + '"'), false);
});
test('invalid IDs, filters and pagination are field errors', async () => {
  for (const path of [
    '/invoices/nope',
    '/subscriptions/2147483648',
    '/invoices?status=UNKNOWN',
    '/subscriptions?pageSize=51',
  ]) {
    const result = await get(path);
    assert.equal(result.status, 400);
    assert.ok(result.body.fields);
  }
});
test('empty filtered lists are valid responses', async () => {
  for (const resource of ['subscriptions', 'invoices']) {
    const result = await get('/' + resource + '?q=nonexistent-portal-verification');
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.items, []);
    assert.equal(result.body.total, 0);
  }
});

// PS-27: lifecycle fixtures are isolated and retain the same plan rules as staff.
const managedIds = [];
const managedPlanIds = [];
const internal = await login('staff@demo.test');
const { today, addDays } = await import('../src/lib/dates.js');
const { manageSubscription } = await import('../src/modules/subscriptions/subscriptions.service.js');
async function createManaged(overrides = {}) {
  const product = await prisma.product.findFirstOrThrow();
  const term = await prisma.paymentTerm.findFirstOrThrow();
  const { canPause = true, canCloseEarly = true, ...subscriptionOverrides } = overrides;
  const plan = await prisma.plan.create({
    data: {
      name: 'PM-' + randomUUID(),
      productId: product.id,
      price: 10000,
      billingPeriod: 'MONTHLY',
      startDate: addDays(today(), -40),
      canPause,
      canCloseEarly,
    },
  });
  managedPlanIds.push(plan.id);
  const subscription = await prisma.subscription.create({
    data: {
      number: 'MG-' + randomUUID().slice(0, 12),
      customerId: first.user.customerId,
      planId: plan.id,
      paymentTermId: term.id,
      status: 'ACTIVE',
      startDate: addDays(today(), -40),
      expiryDate: addDays(today(), 365),
      nextInvoiceDate: addDays(today(), -10),
      recurringAmount: 10000,
      monthlyRecurringAmount: 10000,
      lines: { create: { productId: product.id, quantity: 1, unitPrice: 10000, amount: 10000 } },
      ...subscriptionOverrides,
    },
  });
  managedIds.push(subscription.id);
  return subscription;
}
async function changeStatus(id, action, token = first.token, body = {}) {
  const response = await fetch(base + '/api/portal/subscriptions/' + id + '/' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
afterEach(async () => {
  await prisma.subscription.deleteMany({ where: { id: { in: managedIds } } });
  await prisma.plan.deleteMany({ where: { id: { in: managedPlanIds } } });
  managedIds.length = 0;
  managedPlanIds.length = 0;
});
test('owned pause/resume/close preserves amounts, advances billing and records customer activity', async () => {
  const subscription = await createManaged();
  const paused = await changeStatus(subscription.id, 'pause');
  assert.equal(paused.status, 200);
  assert.equal(paused.body.status, 'PAUSED');
  assert.equal(paused.body.plan.canPause, true);
  assert.equal(paused.body.plan.canCloseEarly, true);
  const storedPause = await prisma.subscription.findUnique({ where: { id: subscription.id } });
  assert.equal(storedPause.nextInvoiceDate.getTime(), subscription.nextInvoiceDate.getTime());
  assert.equal((await changeStatus(subscription.id, 'resume')).body.status, 'ACTIVE');
  const resumed = await prisma.subscription.findUnique({ where: { id: subscription.id } });
  assert.ok(resumed.nextInvoiceDate >= today());
  const closed = await changeStatus(subscription.id, 'close');
  assert.equal(closed.body.status, 'CLOSED');
  assert.equal(closed.body.recurringAmount, 10000);
  assert.equal(Object.hasOwn(closed.body, 'customer'), false);
  const stored = await prisma.subscription.findUnique({ where: { id: subscription.id } });
  assert.equal(stored.closeReason, 'CLOSED_EARLY');
  assert.ok(stored.closedAt);
  assert.equal(stored.nextInvoiceDate, null);
  const history = await prisma.activityLog.findMany({
    where: { subscriptionId: subscription.id },
    orderBy: { id: 'asc' },
  });
  assert.deepEqual(
    history.map((entry) => entry.action),
    ['PAUSED', 'RESUMED', 'CLOSED'],
  );
  assert.ok(history.every((entry) => entry.actorId === first.user.id));
  assert.equal(await prisma.invoice.count({ where: { subscriptionId: subscription.id } }), 0);
});
test('plan flags are enforced by the server without mutation', async () => {
  for (const [action, status] of [
    ['pause', 'ACTIVE'],
    ['resume', 'PAUSED'],
    ['close', 'ACTIVE'],
    ['close', 'PAUSED'],
  ]) {
    const subscription = await createManaged({ status, canPause: false, canCloseEarly: false });
    const result = await changeStatus(subscription.id, action);
    assert.equal(result.status, 409);
    assert.match(result.body.error, /plan does not allow/);
    assert.equal((await prisma.subscription.findUnique({ where: { id: subscription.id } })).status, status);
    assert.equal(await prisma.activityLog.count({ where: { subscriptionId: subscription.id } }), 0);
  }
});
test('foreign and nonexistent subscriptions return identical 404 before plan rules', async () => {
  const subscription = await createManaged({
    customerId: second.user.customerId,
    canPause: false,
    canCloseEarly: false,
  });
  for (const action of ['pause', 'resume', 'close']) {
    const denied = await changeStatus(subscription.id, action);
    assert.equal(denied.status, 404);
    assert.deepEqual(denied, await changeStatus(2147483647, action));
  }
});
test('role, identity and body guards reject every lifecycle action', async () => {
  const subscription = await createManaged();
  for (const action of ['pause', 'resume', 'close']) {
    assert.equal((await changeStatus(subscription.id, action, null)).status, 401);
    for (const token of [admin.token, internal.token])
      assert.equal((await changeStatus(subscription.id, action, token)).status, 403);
    assert.equal((await changeStatus('bad', action)).status, 400);
    assert.equal(
      (await changeStatus(subscription.id, action, first.token, { customerId: second.user.customerId }))
        .status,
      400,
    );
  }
});
test('invalid states fail and concurrent pause succeeds only once', async () => {
  const draft = await createManaged({ status: 'DRAFT' });
  for (const action of ['pause', 'resume', 'close'])
    assert.equal((await changeStatus(draft.id, action)).status, 409);
  const subscription = await createManaged();
  assert.equal((await changeStatus(subscription.id, 'resume')).status, 409);
  const results = await Promise.all([
    changeStatus(subscription.id, 'pause'),
    changeStatus(subscription.id, 'pause'),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal(await prisma.activityLog.count({ where: { subscriptionId: subscription.id } }), 1);
});
test('ownership changes are serialized with all customer lifecycle actions', async () => {
  for (const action of ['pause', 'resume', 'close']) {
    const subscription = await createManaged({ status: action === 'resume' ? 'PAUSED' : 'ACTIVE' });
    let release, locked;
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
          data: { customerId: second.user.customerId },
        });
        locked();
        await gate;
      },
      { timeout: 15000 },
    );
    await ready;
    const pending = changeStatus(subscription.id, action);
    try {
      let waiting = false;
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        const [row] =
          await prisma.$queryRaw`SELECT count(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'`;
        if (row.count > 0) {
          waiting = true;
          break;
        }
        await delay(10);
      }
      assert.ok(waiting, 'the action waits for the ownership transaction');
    } finally {
      release();
      await transfer;
    }
    assert.equal((await pending).status, 404);
    assert.equal(await prisma.activityLog.count({ where: { subscriptionId: subscription.id } }), 0);
  }
});
test('staff lifecycle still uses the shared service', async () => {
  const subscription = await createManaged();
  assert.equal((await manageSubscription(subscription.id, 'PAUSE', admin.user)).status, 'PAUSED');
  assert.equal((await manageSubscription(subscription.id, 'RESUME', admin.user)).status, 'ACTIVE');
  assert.equal((await manageSubscription(subscription.id, 'CLOSE', admin.user)).status, 'CLOSED');
});
