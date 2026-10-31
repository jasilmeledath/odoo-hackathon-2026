// Template validation protects references and prevents accidental price snapshots (PS-11).
import assert from 'node:assert/strict';
import test from 'node:test';
import { templateSchema } from './templates.schemas.js';

const template = {
  name: 'Offer',
  planId: 1,
  validityDays: 30,
  lines: [{ productId: 1, variantId: null, quantity: 1 }],
};
test('template inputs require a plan, positive validity and at least one bounded line', () => {
  assert.equal(templateSchema.parse(template).lines.length, 1);
  for (const change of [
    { validityDays: 0 },
    { validityDays: 1.5 },
    { validityDays: 2147483648 },
    { planId: 0 },
    { lines: [] },
    { lines: Array(101).fill(template.lines[0]) },
    { notes: 'x'.repeat(1001) },
  ])
    assert.equal(templateSchema.safeParse({ ...template, ...change }).success, false);
});
test('template lines reject prices and invalid quantities or variant IDs', () => {
  for (const change of [
    { quantity: 0 },
    { quantity: 0.5 },
    { quantity: 2147483648 },
    { productId: 0 },
    { variantId: -1 },
    { unitPrice: 100 },
  ])
    assert.equal(
      templateSchema.safeParse({ ...template, lines: [{ ...template.lines[0], ...change }] }).success,
      false,
    );
});
