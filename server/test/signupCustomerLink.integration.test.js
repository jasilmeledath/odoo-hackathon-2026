// Signup must never take over a staff-made customer record (PS-1, PS-26).
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

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

test('signing up with a staff-made customer email does not link that customer', async () => {
  const customer = await prisma.customer.findFirst({ where: { userId: null, isActive: true } });
  assert.ok(customer, 'seed must include a customer without a login');

  const response = await fetch(base + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Signup Check', email: customer.email, password: 'Demo@12345' }),
  });
  assert.equal(response.status, 201);
  const { token, user } = await response.json();
  assert.equal(user.customerId, null);

  const linked = await prisma.customer.findUnique({ where: { id: customer.id } });
  assert.equal(linked.userId, null);

  const portal = await fetch(base + '/api/portal/subscriptions', {
    headers: { Authorization: 'Bearer ' + token },
  });
  assert.notEqual(portal.status, 200);

  await prisma.user.deleteMany({ where: { email: customer.email } });
});
