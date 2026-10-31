// Permission matrix and tenant isolation against real routed services (PS-4).
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
if (!process.env.TEST_DATABASE_URL)
  throw new Error('Set TEST_DATABASE_URL to an isolated migrated and seeded PostgreSQL database');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ??= 'isolated-role-regression-secret';
const { prisma } = await import('../src/lib/prisma.js');
const { errorHandler, notFound } = await import('../src/middleware/error.js');
const app = express();
app.use(express.json());
for (const [path, module] of [
  ['auth', 'auth'],
  ['staff', 'staff'],
  ['customers', 'customers'],
  ['products', 'products'],
  ['plans', 'plans'],
  ['taxes', 'taxes'],
  ['payment-terms', 'terms'],
  ['templates', 'templates'],
  ['discounts', 'discounts'],
  ['subscriptions', 'subscriptions'],
  ['billing', 'billing'],
  ['invoices', 'invoices'],
  ['payments', 'payments'],
  ['reports', 'reports'],
  ['portal', 'portal'],
]) {
  const { default: router } = await import('../src/modules/' + module + '/' + module + '.routes.js');
  app.use('/api/' + path, router);
}
app.use(notFound);
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
const admin = await login('admin@demo.test');
const staff = await login('staff@demo.test');
const customer = await login('customer@demo.test');
const otherCustomer = await login('customer2@demo.test');
async function request(path, token, method = 'GET') {
  const response = await fetch(base + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: method === 'GET' ? undefined : '{}',
  });
  return { status: response.status, body: await response.json() };
}
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});
test('customers cannot read any staff module', async () => {
  for (const path of [
    '/staff',
    '/customers',
    '/subscriptions',
    '/billing/due',
    '/invoices',
    '/payments',
    '/reports/summary',
    '/reports/events',
    '/products',
    '/plans',
    '/taxes',
    '/payment-terms',
    '/templates',
    '/discounts',
  ])
    assert.equal((await request(path, customer.token)).status, 403, path);
});
test('internal staff can read the catalog and cannot perform its writes', async () => {
  for (const path of ['/products', '/plans', '/taxes', '/payment-terms', '/templates', '/discounts']) {
    assert.equal((await request(path + '?pageSize=1', staff.token)).status, 200, path);
    for (const [method, target] of [
      ['POST', path],
      ['PUT', path + '/1'],
    ])
      assert.equal((await request(target, staff.token, method)).status, 403, method + ' ' + target);
  }
  assert.equal((await request('/products/1/variants', staff.token, 'POST')).status, 403);
});
test('staff administration is Admin-only', async () => {
  assert.equal((await request('/staff', admin.token)).status, 200);
  assert.equal((await request('/staff', staff.token)).status, 403);
  assert.equal((await request('/staff', customer.token, 'POST')).status, 403);
});
test('staff roles cannot enter customer portal routes', async () => {
  for (const account of [admin, staff])
    for (const path of [
      '/portal/subscriptions',
      '/portal/subscriptions/1',
      '/portal/invoices',
      '/portal/invoices/1',
    ])
      assert.equal((await request(path, account.token)).status, 403);
});
test('foreign customer records are indistinguishable from absent records', async () => {
  for (const [resource, model] of [
    ['subscriptions', prisma.subscription],
    ['invoices', prisma.invoice],
  ]) {
    const owned = await model.findFirst({ where: { customerId: customer.user.customerId } });
    const foreign = await model.findFirst({ where: { customerId: otherCustomer.user.customerId } });
    assert.ok(owned && foreign);
    assert.equal((await request('/portal/' + resource + '/' + owned.id, customer.token)).status, 200);
    const denied = await request('/portal/' + resource + '/' + foreign.id, customer.token);
    assert.equal(denied.status, 404);
    assert.deepEqual(denied, await request('/portal/' + resource + '/2147483647', customer.token));
  }
});
test('token role/ownership claims never override the database identity', async () => {
  const user = await prisma.user.findUnique({ where: { id: customer.user.id } });
  const token = jwt.sign(
    {
      id: user.id,
      passwordVersion: user.passwordChangedAt?.getTime() ?? 0,
      role: 'ADMIN',
      customerId: otherCustomer.user.customerId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );
  assert.equal((await request('/staff', token)).status, 403);
  const result = await request('/portal/subscriptions?customerId=' + otherCustomer.user.customerId, token);
  assert.equal(result.status, 200);
  for (const item of result.body.items)
    assert.equal(
      (await prisma.subscription.findUnique({ where: { id: item.id } })).customerId,
      customer.user.customerId,
    );
});
test('protected modules consistently reject missing authentication', async () => {
  for (const path of ['/customers', '/invoices', '/products', '/portal/subscriptions'])
    assert.equal((await request(path, null)).status, 401);
});
