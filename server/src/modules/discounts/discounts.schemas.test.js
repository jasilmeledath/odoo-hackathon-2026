// Discount state boundaries match the database-backed list filters (PS-19, A-24).
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDiscount } from '../../../../client/src/lib/validators.js';
import { toPaise } from '../../../../client/src/lib/format.js';
import { getDiscountState } from './discounts.service.js';
import { discountListQuerySchema, discountSchema } from './discounts.schemas.js';

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

const fixedRule = {
  name: 'Offer',
  type: 'FIXED',
  fixedAmount: 56000,
  percent: null,
  scope: 'SUBSCRIPTION',
  minPurchaseAmount: 0,
  minQuantity: 0,
  startDate: '2026-10-31',
  endDate: '2026-10-31',
  usageLimit: null,
  productIds: [],
};
test('discount writes accept exactly one positive value and whole paise', () => {
  assert.equal(discountSchema.parse(fixedRule).fixedAmount, 56000);
  assert.equal(
    discountSchema.parse({ ...fixedRule, type: 'PERCENT', fixedAmount: null, percent: 25.25 }).percent,
    25.25,
  );
  for (const change of [
    { fixedAmount: 0 },
    { fixedAmount: 0.5 },
    { percent: 10 },
    { type: 'PERCENT', fixedAmount: null, percent: null },
    { type: 'PERCENT', fixedAmount: null, percent: 100.01 },
    { type: 'PERCENT', fixedAmount: null, percent: 0.001 },
  ])
    assert.equal(discountSchema.safeParse({ ...fixedRule, ...change }).success, false);
});
test('discount writes enforce scope, dates, usage and read-only counters', () => {
  for (const change of [
    { scope: 'PRODUCT' },
    { productIds: [1] },
    { scope: 'PRODUCT', productIds: [1, 1] },
    { startDate: '2026-11-01' },
    { endDate: '2026-02-30' },
    { usageLimit: 0 },
    { minQuantity: -1 },
    { minQuantity: 2147483648 },
    { usageCount: 3 },
    { isActive: 'false' },
  ])
    assert.equal(discountSchema.safeParse({ ...fixedRule, ...change }).success, false);
  assert.deepEqual(
    discountSchema.parse({ ...fixedRule, scope: 'PRODUCT', productIds: [1, 2] }).productIds,
    [1, 2],
  );
});
test('discount client prices and fields match API boundaries', () => {
  const form = {
    ...fixedRule,
    fixedAmount: '560',
    percent: '',
    minPurchaseAmount: '1000',
    minQuantity: '0',
    usageLimit: '',
    products: [],
  };
  assert.deepEqual(validateDiscount(form), {});
  assert.equal(
    discountSchema.parse({ ...fixedRule, fixedAmount: toPaise(form.fixedAmount) }).fixedAmount,
    56000,
  );
  assert.ok(validateDiscount({ ...form, fixedAmount: '0.001' }).fixedAmount);
  assert.equal(
    validateDiscount({ ...form, type: 'PERCENT', percent: '100.01' }).percent,
    'Percentage must be at most 100',
  );
  assert.equal(
    validateDiscount({ ...form, startDate: '2026-11-01' }).endDate,
    'End date must be on or after start date',
  );
  assert.equal(validateDiscount({ ...form, scope: 'PRODUCT' }).productIds, 'Choose at least one product');
  assert.equal(
    validateDiscount({ ...form, usageLimit: '1' }, 2).usageLimit,
    'Usage limit cannot be below the current usage count',
  );
});
