// Money boundaries and active-line totals (PS-12, PS-27).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateSubscriptionAmounts } from './subscriptionAmounts.js';
test('active lines alone contribute to monthly recurring amounts', () => {
  assert.deepEqual(
    calculateSubscriptionAmounts([{ amount: 12000 }, { amount: 2400, isActive: false }], 'YEARLY'),
    { recurringAmount: 12000, monthlyRecurringAmount: 1000 },
  );
});
test('staff-created lines retain their current pricing totals', () => {
  assert.deepEqual(calculateSubscriptionAmounts([{ amount: 10000 }, { amount: 2500 }], 'MONTHLY'), {
    recurringAmount: 12500,
    monthlyRecurringAmount: 12500,
  });
});
test('daily conversion and total overflow are rejected before writes', () => {
  assert.throws(() => calculateSubscriptionAmounts([{ amount: 2147483647 }], 'DAILY'), { status: 400 });
  assert.throws(() => calculateSubscriptionAmounts([{ amount: 2147483647 }, { amount: 1 }], 'MONTHLY'), {
    status: 400,
  });
});
