// Real database regression for reviewer-reported session revocation (PS-3, PS-5).
import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
if (!process.env.TEST_DATABASE_URL)
  throw new Error('Set TEST_DATABASE_URL to an isolated migrated PostgreSQL database');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ??= 'isolated-session-regression-secret';
const { prisma } = await import('../src/lib/prisma.js');
const { requireAuth, signToken } = await import('../src/middleware/auth.js');
const { login } = await import('../src/modules/auth/auth.service.js');
const { saveStaff } = await import('../src/modules/staff/staff.service.js');
const changePassword = (user, password) =>
  saveStaff(user.id, { name: user.name, email: user.email, password, isActive: true });
const createdIds = [];
const authenticate = (token) => requireAuth({ headers: { authorization: 'Bearer ' + token } }, {}, () => {});
async function createAccount() {
  const user = await prisma.user.create({
    data: {
      name: 'Session regression',
      email: 'session-' + randomBytes(8).toString('hex') + '@demo.test',
      role: 'INTERNAL',
      passwordHash: await bcrypt.hash('Strong@abc', 10),
    },
  });
  createdIds.push(user.id);
  return user;
}
afterEach(async () => {
  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: createdIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
  createdIds.length = 0;
});
after(() => prisma.$disconnect());
test('a same-second password change revokes an existing login and allows fresh credentials', async (context) => {
  const user = await createAccount();
  const epoch = Math.floor(Date.now() / 1000) * 1000;
  let now = epoch + 100;
  context.mock.method(Date, 'now', () => now);
  const oldToken = signToken(user);
  now = epoch + 800;
  await changePassword(user, 'Better@abc');
  await assert.rejects(() => authenticate(oldToken), { status: 401 });
  await authenticate((await login({ email: user.email, password: 'Better@abc' })).token);
});
test('successive changes with an intervening login revoke that login', async (context) => {
  const user = await createAccount();
  const epoch = Math.floor(Date.now() / 1000) * 1000;
  let now = epoch + 100;
  context.mock.method(Date, 'now', () => now);
  await changePassword(user, 'Better@abc');
  now = epoch + 200;
  const intervening = await login({ email: user.email, password: 'Better@abc' });
  now = epoch + 800;
  await changePassword(user, 'Third@abc');
  now = epoch + 900;
  await assert.rejects(() => authenticate(intervening.token), { status: 401 });
  await authenticate((await login({ email: user.email, password: 'Third@abc' })).token);
});
test('password changes in the same millisecond use different versions', async (context) => {
  const user = await createAccount();
  const now = Date.now();
  context.mock.method(Date, 'now', () => now);
  await changePassword(user, 'Better@abc');
  const first = await prisma.user.findUnique({ where: { id: user.id } });
  const token = (await login({ email: user.email, password: 'Better@abc' })).token;
  await changePassword(user, 'Third@abc');
  const second = await prisma.user.findUnique({ where: { id: user.id } });
  assert.ok(second.passwordChangedAt.getTime() > first.passwordChangedAt.getTime());
  await assert.rejects(() => authenticate(token), { status: 401 });
  await authenticate((await login({ email: user.email, password: 'Third@abc' })).token);
});
