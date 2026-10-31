// Plan write boundaries protect sale dates, quantity and behaviour flags (PS-8, PS-9).
import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePlan } from '../../../../client/src/lib/validators.js';
import { toPaise } from '../../../../client/src/lib/format.js';
import { planSchema } from './plans.schemas.js';

const plan = {
  name: 'Monthly',
  productId: 1,
  price: 125050,
  billingPeriod: 'MONTHLY',
  minQuantity: 1,
  startDate: '2026-10-01',
  endDate: '2026-10-31',
};
test('plans support all billing periods and inclusive sale boundaries', () => {
  for (const billingPeriod of ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    assert.equal(planSchema.safeParse({ ...plan, billingPeriod }).success, true);
  assert.equal(planSchema.safeParse({ ...plan, endDate: plan.startDate }).success, true);
  assert.equal(planSchema.safeParse({ ...plan, endDate: null }).success, true);
  const reversed = planSchema.safeParse({ ...plan, endDate: '2026-09-30' });
  assert.equal(reversed.success, false);
  assert.equal(reversed.error.issues[0].path[0], 'endDate');
});
test('plan writes reject invalid money, dates, quantities and boolean strings', () => {
  for (const change of [
    { price: -1 },
    { price: 0.5 },
    { minQuantity: 0 },
    { minQuantity: 1.5 },
    { productId: 0 },
    { startDate: '2026-02-30' },
    { billingPeriod: 'HOURLY' },
    { canPause: 'false' },
  ])
    assert.equal(planSchema.safeParse({ ...plan, ...change }).success, false);
  const flags = planSchema.parse({
    ...plan,
    closesAtExpiry: true,
    canCloseEarly: false,
    canPause: true,
    canRenew: false,
  });
  assert.deepEqual(
    [flags.closesAtExpiry, flags.canCloseEarly, flags.canPause, flags.canRenew],
    [true, false, true, false],
  );
});

test('plan client validation agrees with sale-date and rupee boundaries', () => {
  const form = { ...plan, productId: '1', price: '1250.50', minQuantity: '3' };
  assert.deepEqual(validatePlan(form), {});
  assert.equal(
    planSchema.parse({
      ...form,
      productId: Number(form.productId),
      price: toPaise(form.price),
      minQuantity: Number(form.minQuantity),
    }).price,
    125050,
  );
  for (const endDate of ['2026-09-30', '2026-10-01', '2026-10-31', '2026-02-30']) {
    assert.equal(
      !validatePlan({ ...form, endDate }).endDate,
      planSchema.safeParse({ ...plan, endDate }).success,
    );
  }
  assert.ok(validatePlan({ ...form, minQuantity: '0' }).minQuantity);
  assert.ok(validatePlan({ ...form, price: '1.001' }).price);
});
