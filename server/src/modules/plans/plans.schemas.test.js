// Regression coverage for catalog date, enum and false-filter validation (#4).
import assert from 'node:assert/strict';
import test from 'node:test';
import { idParamSchema } from '../../lib/validation.js';
import { productListQuerySchema } from '../products/products.schemas.js';
import { planListQuerySchema } from './plans.schemas.js';

test('catalog filters preserve false and reject invalid enum/boolean values', () => {
  assert.equal(productListQuerySchema.parse({ isActive: 'false' }).isActive, false);
  assert.equal(planListQuerySchema.parse({ isActive: 'true' }).isActive, true);
  assert.equal(productListQuerySchema.safeParse({ type: 'UNKNOWN' }).success, false);
  assert.equal(planListQuerySchema.safeParse({ isActive: 'yes' }).success, false);
});

test('availability accepts a real leap day but rejects impossible or timestamp dates', () => {
  assert.equal(
    planListQuerySchema.parse({ availableOn: '2028-02-29' }).availableOn.toISOString(),
    '2028-02-29T00:00:00.000Z',
  );
  for (const availableOn of ['2026-02-29', '2026-04-31', '2026-10-31T00:00:00Z']) {
    assert.equal(planListQuerySchema.safeParse({ availableOn }).success, false);
  }
});

test('catalog lists enforce pagination limits', () => {
  for (const pageSize of ['0', '51', '1.5']) {
    assert.equal(productListQuerySchema.safeParse({ pageSize }).success, false);
  }
  assert.equal(planListQuerySchema.parse({}).pageSize, 10);
});

test('record identifiers stay within PostgreSQL integer bounds', () => {
  for (const id of ['0', '-1', '1.5', '2147483648', 'abc']) {
    assert.equal(idParamSchema.safeParse({ id }).success, false);
  }
  assert.equal(idParamSchema.parse({ id: '2147483647' }).id, 2147483647);
});
