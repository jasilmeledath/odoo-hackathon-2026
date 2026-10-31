// Real customer ownership and field-exposure regressions (PS-26, PS-4).
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
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
