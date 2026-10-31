// Product price and input boundaries preserve the paise contract (PS-6).
import assert from 'node:assert/strict';
import test from 'node:test';
import { productSchema } from './products.schemas.js';

const product = { name: 'Software', type: 'SOFTWARE', salesPrice: 125050, costPrice: 100000 };
test('product writes keep whole paise and trim names', () => {
  assert.equal(productSchema.parse({ ...product, name: ' Software ' }).name, 'Software');
  for (const salesPrice of [-1, 0.5, 1000000001, '125050']) {
    assert.equal(productSchema.safeParse({ ...product, salesPrice }).success, false);
  }
  assert.equal(productSchema.parse({ ...product, salesPrice: 0 }).salesPrice, 0);
});
test('product writes reject unknown types, empty names and oversized notes', () => {
  assert.equal(productSchema.safeParse({ ...product, type: 'WRONG' }).success, false);
  assert.equal(productSchema.safeParse({ ...product, name: ' ' }).success, false);
  assert.equal(productSchema.safeParse({ ...product, notes: 'x'.repeat(1001) }).success, false);
});
