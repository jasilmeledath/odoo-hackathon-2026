// Customer directory query filters apply active state before pagination (PS-12).
import assert from 'node:assert/strict';
import test from 'node:test';
import { customerListQuerySchema } from './customers.schemas.js';

test('customer list active filter preserves both boolean query values', () => {
  assert.equal(customerListQuerySchema.parse({ isActive: 'true' }).isActive, true);
  assert.equal(customerListQuerySchema.parse({ isActive: 'false' }).isActive, false);
  assert.equal(customerListQuerySchema.parse({}).isActive, undefined);
  assert.equal(customerListQuerySchema.safeParse({ isActive: 'yes' }).success, false);
});
