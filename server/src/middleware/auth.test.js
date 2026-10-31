// Signed session-version regressions for successive password changes (PS-3, PS-5).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { nextPasswordChangedAt, matchesPasswordVersion } from '../lib/sessions.js';
import { signToken } from './auth.js';
process.env.JWT_SECRET ??= 'local-session-version-regression-secret';
const EPOCH_MS = 2_000_000_000_000;
const account = () => ({ id: 123, passwordChangedAt: null });
const matches = (token, user) => matchesPasswordVersion(jwt.verify(token, process.env.JWT_SECRET), user);
test('successive changes with an intervening login revoke the first login', (context) => {
  let now = EPOCH_MS + 100;
  const user = account();
  user.passwordChangedAt = new Date(now);
  context.mock.method(Date, 'now', () => now);
  now = EPOCH_MS + 200;
  const oldToken = signToken(user);
  assert.equal(jwt.decode(oldToken).iat, EPOCH_MS / 1000);
  assert.equal(matches(oldToken, user), true);
  now = EPOCH_MS + 800;
  user.passwordChangedAt = nextPasswordChangedAt(user.passwordChangedAt);
  now = EPOCH_MS + 900;
  assert.equal(matches(oldToken, user), false);
  assert.equal(matches(signToken(user), user), true);
});
test('a staff password change revokes a preexisting token in the same second', (context) => {
  let now = EPOCH_MS + 100;
  const user = account();
  context.mock.method(Date, 'now', () => now);
  const oldToken = signToken(user);
  now = EPOCH_MS + 800;
  user.passwordChangedAt = nextPasswordChangedAt(user.passwordChangedAt);
  assert.equal(matches(oldToken, user), false);
  assert.equal(matches(signToken(user), user), true);
});
test('successive writes in one millisecond receive distinct versions', (context) => {
  context.mock.method(Date, 'now', () => EPOCH_MS);
  const first = nextPasswordChangedAt(null);
  const second = nextPasswordChangedAt(first);
  assert.equal(first.getTime(), EPOCH_MS);
  assert.equal(second.getTime(), EPOCH_MS + 1);
});
test('legacy tokens remain valid only until the first password change', () => {
  const user = account();
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  assert.equal(matches(token, user), true);
  user.passwordChangedAt = new Date();
  assert.equal(matches(token, user), false);
});
