// Tax/term validation regressions cover database boundaries and precision (#13).
import assert from 'node:assert/strict';
import test from 'node:test';
import { taxSchema } from './taxes.schemas.js';
import { paymentTermSchema } from '../terms/terms.schemas.js';

test('tax rates include zero and 100 but reject range and precision overflow', () => {
  for (const ratePercent of [0, 0.29, 18.25, 100])
    assert.equal(taxSchema.safeParse({ name: 'GST', ratePercent }).success, true);
  for (const ratePercent of [-1, 100.01, 18.251, '18', null])
    assert.equal(taxSchema.safeParse({ name: 'GST', ratePercent }).success, false);
});

test('payment terms accept zero days and reject invalid integer domains', () => {
  assert.equal(paymentTermSchema.parse({ name: ' Immediate ', dueDays: 0 }).name, 'Immediate');
  for (const dueDays of [-1, 1.5, 2147483648, null])
    assert.equal(paymentTermSchema.safeParse({ name: 'Net', dueDays }).success, false);
  assert.equal(paymentTermSchema.safeParse({ name: ' ', dueDays: 30 }).success, false);
});
