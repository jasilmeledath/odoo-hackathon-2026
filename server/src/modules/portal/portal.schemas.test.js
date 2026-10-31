// Portal filter boundaries and missing-profile isolation (PS-26, PS-4).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { portalSubscriptionQuerySchema, portalInvoiceQuerySchema } from './portal.schemas.js';
import { listSubscriptions, listInvoices, getSubscription, getInvoice } from './portal.service.js';
test('portal filters reject invalid statuses and page sizes', () => {
  for (const schema of [portalSubscriptionQuerySchema, portalInvoiceQuerySchema]) {
    assert.equal(schema.safeParse({ pageSize: 51 }).success, false);
    assert.equal(schema.safeParse({ status: 'UNKNOWN' }).success, false);
    assert.equal(schema.safeParse({ q: 'x'.repeat(101) }).success, false);
    assert.equal(schema.safeParse({ pageSize: 1 }).success, true);
  }
});
test('untrusted customerId filters are discarded', () => {
  const result = portalInvoiceQuerySchema.parse({ customerId: 123 });
  assert.equal(result.customerId, undefined);
});
test('a missing customer profile cannot remove the ownership predicate', async () => {
  for (const customerId of [null, undefined, 0, -1]) {
    assert.throws(() => listSubscriptions(customerId, {}), { status: 404 });
    await assert.rejects(() => listInvoices(customerId, {}), { status: 404 });
    await assert.rejects(() => getSubscription(customerId, 1), { status: 404 });
    await assert.rejects(() => getInvoice(customerId, 1), { status: 404 });
  }
});
