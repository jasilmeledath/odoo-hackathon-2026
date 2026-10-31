// Attempt limits, connection identity and bounded storage regressions (PS-29).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createAttemptLimiter } from './authRateLimit.js';
const attempt = (limiter, ip = 'client-a') => {
  let failure;
  const headers = {};
  limiter(
    { ip },
    {
      set: (key, value) => {
        headers[key] = value;
      },
    },
    (error) => {
      failure = error;
    },
  );
  return { failure, headers };
};
test('normal use passes until the configured limit, then gives a wait time', () => {
  const limiter = createAttemptLimiter({ limit: 2, windowMs: 5000, now: () => 1000 });
  assert.equal(attempt(limiter).failure, undefined);
  assert.equal(attempt(limiter).failure, undefined);
  const blocked = attempt(limiter);
  assert.equal(blocked.failure.status, 429);
  assert.equal(blocked.headers['Retry-After'], '5');
  assert.match(blocked.failure.message, /5 seconds/);
});
test('clients and endpoint instances have independent windows', () => {
  const first = createAttemptLimiter({ limit: 1 });
  const second = createAttemptLimiter({ limit: 1 });
  attempt(first);
  assert.equal(attempt(first).failure.status, 429);
  assert.equal(attempt(first, 'client-b').failure, undefined);
  assert.equal(attempt(second).failure, undefined);
});
test('blocked calls do not extend the window and expiry permits normal use', () => {
  let now = 0;
  const limiter = createAttemptLimiter({ limit: 1, windowMs: 5000, now: () => now });
  attempt(limiter);
  now = 4001;
  assert.equal(attempt(limiter).headers['Retry-After'], '1');
  now = 5000;
  assert.equal(attempt(limiter).failure, undefined);
});
test('full storage preserves existing limits and releases expired clients', () => {
  let now = 0;
  const limiter = createAttemptLimiter({ limit: 1, windowMs: 1000, maxClients: 1, now: () => now });
  attempt(limiter);
  assert.equal(attempt(limiter, 'client-b').failure.status, 429);
  assert.equal(attempt(limiter).failure.status, 429);
  now = 1000;
  assert.equal(attempt(limiter, 'client-b').failure, undefined);
});
test('forwarded headers cannot bypass the connection-IP limit', async () => {
  const app = express();
  app.post('/login', createAttemptLimiter({ limit: 1 }), (_req, res) => res.json({ ok: true }));
  app.use((error, _req, res, _next) => res.status(error.status).json({ error: error.message }));
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const url = 'http://127.0.0.1:' + server.address().port + '/login';
    assert.equal(
      (await fetch(url, { method: 'POST', headers: { 'X-Forwarded-For': 'client-a' } })).status,
      200,
    );
    const blocked = await fetch(url, { method: 'POST', headers: { 'X-Forwarded-For': 'client-b' } });
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('Retry-After')) > 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
