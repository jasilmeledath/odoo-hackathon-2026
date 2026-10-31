// Discount state boundaries match the database-backed list filters (PS-19, A-24).
import assert from 'node:assert/strict';
import test from 'node:test';
import { getDiscountState } from './discounts.service.js';
import { discountListQuerySchema } from './discounts.schemas.js';

const on = new Date('2026-10-31');
const rule = { isActive: true, startDate: on, endDate: on, usageLimit: 2, usageCount: 1 };
test('discount states include both date boundaries and preserve precedence', () => {
  assert.equal(getDiscountState(rule, on), 'ACTIVE');
  assert.equal(getDiscountState({ ...rule, usageLimit: null, usageCount: 99 }, on), 'ACTIVE');
  assert.equal(getDiscountState({ ...rule, usageCount: 2 }, on), 'USED_UP');
  assert.equal(
    getDiscountState({ ...rule, startDate: new Date('2026-11-01'), endDate: new Date('2026-11-02') }, on),
    'SCHEDULED',
  );
  assert.equal(getDiscountState({ ...rule, endDate: new Date('2026-10-30'), usageCount: 2 }, on), 'EXPIRED');
  assert.equal(getDiscountState({ ...rule, isActive: false, usageCount: 2 }, on), 'INACTIVE');
});
test('discount list rejects unrecognized states and excessive pages', () => {
  assert.equal(discountListQuerySchema.safeParse({ state: 'OTHER' }).success, false);
  assert.equal(discountListQuerySchema.safeParse({ pageSize: '51' }).success, false);
});
