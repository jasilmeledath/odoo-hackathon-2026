// Renewal accepts one strict calendar date for the existing subscription (PS-14).
import assert from 'node:assert/strict';
import test from 'node:test';
import { subscriptionRenewSchema } from './subscriptions.schemas.js';

test('renewal accepts a calendar expiry date and rejects timestamps or impossible days', () => {
  assert.equal(
    subscriptionRenewSchema.parse({ expiryDate: '2027-10-31' }).expiryDate.toISOString(),
    '2027-10-31T00:00:00.000Z',
  );
  assert.equal(subscriptionRenewSchema.safeParse({ expiryDate: '2027-02-29' }).success, false);
  assert.equal(subscriptionRenewSchema.safeParse({ expiryDate: '2027-10-31T00:00:00Z' }).success, false);
});
