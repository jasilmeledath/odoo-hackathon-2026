// Pausing skips elapsed periods and keeps the original calendar anchor (A-18).
import assert from 'node:assert/strict';
import test from 'node:test';
import { nextBillingDateAfterPause } from './subscriptionLifecycle.js';

const date = (value) => new Date(`${value}T00:00:00.000Z`);
const iso = (value) => value?.toISOString().slice(0, 10) ?? null;

test('resume keeps the next boundary when it is still upcoming', () => {
  assert.equal(
    iso(nextBillingDateAfterPause(date('2026-02-28'), date('2026-01-31'), 'MONTHLY', date('2026-02-10'))),
    '2026-02-28',
  );
});

test('resume skips paused monthly periods while preserving a day-31 anchor', () => {
  assert.equal(
    iso(nextBillingDateAfterPause(date('2026-02-28'), date('2026-01-31'), 'MONTHLY', date('2026-03-05'))),
    '2026-03-31',
  );
});

test('resume can bill on the current boundary and handles weekly periods', () => {
  assert.equal(
    iso(nextBillingDateAfterPause(date('2026-02-28'), date('2026-01-31'), 'MONTHLY', date('2026-02-28'))),
    '2026-02-28',
  );
  assert.equal(
    iso(nextBillingDateAfterPause(date('2026-03-07'), date('2026-02-28'), 'WEEKLY', date('2026-03-20'))),
    '2026-03-21',
  );
});

test('resume leaves billing disabled when there is no next invoice date', () => {
  assert.equal(nextBillingDateAfterPause(null, date('2026-01-31'), 'MONTHLY', date('2026-03-05')), null);
});
