// Tax/term validation regressions cover database boundaries and precision (#13).
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCatalogRule } from '../../../../client/src/lib/validators.js';
import { taxSchema } from './taxes.schemas.js';
import { paymentTermSchema } from '../terms/terms.schemas.js';

test('tax rules enforce 0-100% and up to two decimal places', () => {
  for (const ratePercent of [0, 5, 18, 18.25, 100])
    assert.equal(taxSchema.safeParse({ name: 'GST', ratePercent }).success, true);
  for (const ratePercent of [-1, 100.01, 18.255, NaN])
    assert.equal(taxSchema.safeParse({ name: 'GST', ratePercent }).success, false);
  assert.equal(taxSchema.safeParse({ name: '', ratePercent: 5 }).success, false);
});

test('payment terms accept zero days and enforce 32-bit positive integers', () => {
  for (const dueDays of [0, 15, 30, 2147483647])
    assert.equal(paymentTermSchema.safeParse({ name: 'Net', dueDays }).success, true);
  for (const dueDays of [-1, 1.5, 2147483648, NaN])
    assert.equal(paymentTermSchema.safeParse({ name: 'Net', dueDays }).success, false);
  assert.equal(paymentTermSchema.safeParse({ name: ' ', dueDays: 30 }).success, false);
});

test('client and server reject the same tax/term input boundaries', () => {
  for (const [isTax, values] of [
    [true, [-1, 0, 0.29, 18.251, 100, 101]],
    [false, [-1, 0, 1.5, 30, 2147483648]],
  ]) {
    const key = isTax ? 'ratePercent' : 'dueDays';
    const schema = isTax ? taxSchema : paymentTermSchema;
    for (const value of values) {
      const input = { name: 'Rule', [key]: value };
      assert.equal(
        schema.safeParse(input).success,
        Object.keys(validateCatalogRule({ ...input, [key]: String(value) }, isTax)).length === 0,
      );
    }
  }
});
