// Owned add-on writes, immutable plan lines and concurrent totals (PS-27).
import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { randomBytes } from 'node:crypto';
import express from 'express';
if (!process.env.TEST_DATABASE_URL)
  throw new Error('Set TEST_DATABASE_URL to an isolated migrated and seeded PostgreSQL database');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ??= 'isolated-addon-regression-secret';
const { prisma } = await import('../src/lib/prisma.js');
const { today, addDays } = await import('../src/lib/dates.js');
const { default: portalRoutes } = await import('../src/modules/portal/portal.routes.js');
const { default: authRoutes } = await import('../src/modules/auth/auth.routes.js');
const { errorHandler } = await import('../src/middleware/error.js');
const { setSubscriptionLineActive } =
  await import('../src/modules/subscriptions/subscriptionAddons.service.js');
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
const fixtures = [];
async function createFixture(owner = customer, twoAddons = false) {
  const product = await prisma.product.findFirst({ where: { isActive: true } });
  const addon = await prisma.product.findFirst({ where: { isActive: true, id: { not: product.id } } });
  const paymentTerm = await prisma.paymentTerm.findFirst();
  const plan = await prisma.plan.create({
    data: {
      name: 'Addon regression ' + randomBytes(6).toString('hex'),
      productId: product.id,
      price: 10000,
      billingPeriod: 'MONTHLY',
      startDate: today(),
    },
  });
  const subscription = await prisma.subscription.create({
    data: {
      number: 'ADDON-' + randomBytes(6).toString('hex'),
      customerId: owner.user.customerId,
      planId: plan.id,
      paymentTermId: paymentTerm.id,
      status: 'ACTIVE',
      startDate: today(),
      expiryDate: addDays(today(), 365),
      recurringAmount: 15000,
      monthlyRecurringAmount: 15000,
      lines: {
        create: [
          { productId: product.id, quantity: 1, unitPrice: 10000, amount: 10000 },
          {
            productId: addon.id,
            quantity: 1,
            unitPrice: twoAddons ? 2500 : 5000,
            amount: twoAddons ? 2500 : 5000,
          },
          ...(twoAddons ? [{ productId: addon.id, quantity: 1, unitPrice: 2500, amount: 2500 }] : []),
        ],
      },
    },
    include: { lines: { orderBy: { id: 'asc' } } },
  });
  fixtures.push({ id: subscription.id, planId: plan.id });
  return subscription;
}
async function patch(subscriptionId, lineId, body = { isActive: false }, token = customer.token) {
  const response = await fetch(base + '/api/portal/subscriptions/' + subscriptionId + '/lines/' + lineId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
afterEach(async () => {
  for (const fixture of fixtures) {
    await prisma.activityLog.deleteMany({ where: { subscriptionId: fixture.id } });
    await prisma.subscription.delete({ where: { id: fixture.id } });
    await prisma.plan.delete({ where: { id: fixture.planId } });
  }
  fixtures.length = 0;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});
test('switching an owned add-on updates both totals and creates one activity', async () => {
  const subscription = await createFixture();
  const changed = await patch(subscription.id, subscription.lines[1].id);
  assert.equal(changed.status, 200);
  assert.equal(changed.body.recurringAmount, 10000);
  assert.equal(changed.body.lines.find((line) => line.id === subscription.lines[1].id).isActive, false);
  const saved = await prisma.subscription.findUnique({ where: { id: subscription.id } });
  assert.equal(saved.monthlyRecurringAmount, 10000);
  assert.equal(
    await prisma.activityLog.count({
      where: { subscriptionId: subscription.id, action: 'UPDATED', actorId: customer.user.id },
    }),
    1,
  );
  assert.equal(
    (await patch(subscription.id, subscription.lines[1].id, { isActive: true })).body.recurringAmount,
    15000,
  );
});
test('the plan product cannot be switched off and boolean input is strict', async () => {
  const subscription = await createFixture();
  const refused = await patch(subscription.id, subscription.lines[0].id);
  assert.equal(refused.status, 400);
  assert.ok(refused.body.fields.isActive);
  for (const body of [{}, { isActive: 'false' }])
    assert.equal((await patch(subscription.id, subscription.lines[1].id, body)).status, 400);
  assert.equal(
    (await prisma.subscription.findUnique({ where: { id: subscription.id } })).recurringAmount,
    15000,
  );
});
test('foreign subscriptions and foreign lines return 404; staff get 403', async () => {
  const owned = await createFixture();
  const foreign = await createFixture(other);
  assert.equal((await patch(foreign.id, foreign.lines[1].id)).status, 404);
  assert.equal((await patch(owned.id, foreign.lines[1].id)).status, 404);
  assert.equal((await patch(owned.id, owned.lines[1].id, { isActive: false }, admin.token)).status, 403);
});
test('closed subscriptions reject changes; repeated identical state is a no-op', async () => {
  const subscription = await createFixture();
  assert.equal((await patch(subscription.id, subscription.lines[1].id, { isActive: true })).status, 200);
  assert.equal(await prisma.activityLog.count({ where: { subscriptionId: subscription.id } }), 0);
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'CLOSED', closedAt: new Date(), closeReason: 'CLOSED_EARLY' },
  });
  assert.equal((await patch(subscription.id, subscription.lines[1].id)).status, 409);
});
test('concurrent add-on writes cannot lose a total update', async () => {
  const subscription = await createFixture(customer, true);
  const results = await Promise.all(
    subscription.lines.slice(1).map((line) => patch(subscription.id, line.id)),
  );
  assert.deepEqual(
    results.map((result) => result.status),
    [200, 200],
  );
  const saved = await prisma.subscription.findUnique({
    where: { id: subscription.id },
    include: { lines: true },
  });
  assert.equal(saved.recurringAmount, 10000);
  assert.equal(saved.monthlyRecurringAmount, 10000);
  assert.equal(saved.lines.filter((line) => line.isActive).length, 1);
});
test('an audit failure rolls back the line and both totals', async () => {
  const subscription = await createFixture();
  await assert.rejects(() =>
    setSubscriptionLineActive(subscription.id, subscription.lines[1].id, false, {
      id: 2147483647,
      customerId: customer.user.customerId,
    }),
  );
  const saved = await prisma.subscription.findUnique({
    where: { id: subscription.id },
    include: { lines: true },
  });
  assert.equal(saved.recurringAmount, 15000);
  assert.equal(saved.monthlyRecurringAmount, 15000);
  assert.equal(saved.lines.find((line) => line.id === subscription.lines[1].id).isActive, true);
});
