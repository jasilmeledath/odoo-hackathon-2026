// Subscription draft inputs keep PostgreSQL identifiers and calendar dates valid (PS-12).
import assert from 'node:assert/strict';
import test from 'node:test';
import { subscriptionWriteSchema } from './subscriptions.schemas.js';

const validDraft = {
  customerId: 1,
  planId: 2,
  paymentTermId: 3,
  startDate: '2026-10-31',
  expiryDate: '2027-10-31',
  notes: 'Annual renewal',
  lines: [{ productId: 4, variantId: null, quantity: 2 }],
};

test('subscription drafts accept valid dates, identifiers and line quantities', () => {
  const parsed = subscriptionWriteSchema.parse(validDraft);
  assert.equal(parsed.startDate.toISOString(), '2026-10-31T00:00:00.000Z');
  assert.equal(parsed.lines[0].quantity, 2);
  assert.equal(subscriptionWriteSchema.parse({ ...validDraft, templateId: 9 }).templateId, 9);
  assert.equal(subscriptionWriteSchema.parse({ ...validDraft, templateId: null }).templateId, null);
});

test('subscription drafts reject empty lines, invalid dates, ids and quantities', () => {
  assert.equal(subscriptionWriteSchema.safeParse({ ...validDraft, lines: [] }).success, false);
  assert.equal(subscriptionWriteSchema.safeParse({ ...validDraft, startDate: '2026-02-30' }).success, false);
  assert.equal(subscriptionWriteSchema.safeParse({ ...validDraft, planId: 0 }).success, false);
  assert.equal(subscriptionWriteSchema.safeParse({ ...validDraft, templateId: 0 }).success, false);
  assert.equal(
    subscriptionWriteSchema.safeParse({ ...validDraft, lines: [{ productId: 4, quantity: 0 }] }).success,
    false,
  );
  assert.equal(
    subscriptionWriteSchema.safeParse({ ...validDraft, expiryDate: validDraft.startDate }).success,
    false,
  );
});
