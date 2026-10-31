// Exercise all real auth routes and standard 429 responses (PS-29).
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express from 'express';
if (!process.env.TEST_DATABASE_URL)
  throw new Error('Set TEST_DATABASE_URL to an isolated migrated and seeded PostgreSQL database');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { prisma } = await import('../src/lib/prisma.js');
const { default: authRoutes } = await import('../src/modules/auth/auth.routes.js');
const { errorHandler } = await import('../src/middleware/error.js');
const { LOGIN_ATTEMPT_LIMIT, RECOVERY_ATTEMPT_LIMIT, RESET_ATTEMPT_LIMIT } =
  await import('../src/middleware/authRateLimit.js');
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);
const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = 'http://127.0.0.1:' + server.address().port + '/api/auth';
async function post(path, body) {
  return fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});
test('normal auth works and every attempt endpoint enforces its own retry window', async () => {
  const login = await post('/login', { email: 'admin@demo.test', password: 'Demo@12345' });
  assert.equal(login.status, 200);
  const token = (await login.json()).token;
  const recovery = await post('/forgot-password', { email: 'unknown-rate-limit@demo.test' });
  assert.equal(recovery.status, 200);
  for (const [path, limit] of [
    ['/forgot-password', RECOVERY_ATTEMPT_LIMIT],
    ['/reset-password', RESET_ATTEMPT_LIMIT],
    ['/login', LOGIN_ATTEMPT_LIMIT],
  ]) {
    const used = path === '/reset-password' ? 0 : 1;
    for (let count = used; count < limit; count++) assert.equal((await post(path, {})).status, 400);
    const blocked = await post(path, {});
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('Retry-After')) > 0);
    assert.match((await blocked.json()).error, /Try again in [0-9]+ seconds/);
  }
  const me = await fetch(base + '/me', { headers: { Authorization: 'Bearer ' + token } });
  assert.equal(me.status, 200);
});
