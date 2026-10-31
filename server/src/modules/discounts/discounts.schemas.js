// Discount list states are derived, never stored (PS-19).
import { z } from 'zod';
import { DiscountType, DiscountScope } from '../../generated/prisma/enums.js';
import { requiredText, moneyField, dateField } from '../../lib/validation.js';
import { listQuerySchema } from '../../lib/pagination.js';

export const DISCOUNT_STATES = ['ACTIVE', 'EXPIRED', 'USED_UP', 'SCHEDULED', 'INACTIVE'];
export const discountListQuerySchema = listQuerySchema.extend({
  state: z.enum(DISCOUNT_STATES, { error: 'Choose a valid discount state' }).optional(),
});

// PS-19: only one value type is stored, and product scope needs real choices.
const MAX_DISCOUNT_NAME = 120;
const MAX_DISCOUNT_PRODUCTS = 100;
const MAX_DISCOUNT_INTEGER = 2_147_483_647;
const MAX_PERCENTAGE = 100;
const PERCENT_DECIMAL_PLACES = 2;
const integer = (label, minimum) =>
  z
    .number({ error: label + ' is required' })
    .int(label + ' must be a whole number')
    .min(minimum, label + ' must be at least ' + minimum)
    .max(MAX_DISCOUNT_INTEGER, label + ' is too large');
export const discountSchema = z
  .object({
    name: requiredText('Name', MAX_DISCOUNT_NAME),
    type: z.enum(DiscountType, { error: 'Choose a valid discount type' }),
    fixedAmount: moneyField('Fixed amount').nullable().optional(),
    percent: z
      .number({ error: 'Percentage is required' })
      .gt(0, 'Percentage must be greater than 0')
      .max(MAX_PERCENTAGE, 'Percentage must be at most 100')
      .refine(
        (value) => Number(value.toFixed(PERCENT_DECIMAL_PLACES)) === value,
        'Percentage must have at most 2 decimal places',
      )
      .nullable()
      .optional(),
    scope: z.enum(DiscountScope, { error: 'Choose a valid discount scope' }),
    minPurchaseAmount: moneyField('Minimum purchase').default(0),
    minQuantity: integer('Minimum quantity', 0).default(0),
    startDate: dateField('Start date'),
    endDate: dateField('End date'),
    usageLimit: integer('Usage limit', 1).nullable().default(null),
    isActive: z.boolean().default(true),
    productIds: z
      .array(integer('Product', 1))
      .max(MAX_DISCOUNT_PRODUCTS, 'Choose at most 100 products')
      .refine((ids) => new Set(ids).size === ids.length, 'Choose each product only once')
      .default([]),
  })
  .strict()
  .superRefine((value, context) => {
    const issue = (key, message) => context.addIssue({ code: 'custom', path: [key], message });
    if (value.type === 'FIXED') {
      if (value.fixedAmount === null || value.fixedAmount === undefined)
        issue('fixedAmount', 'Fixed amount is required');
      else if (value.fixedAmount <= 0) issue('fixedAmount', 'Fixed amount must be greater than 0');
      if (value.percent !== null && value.percent !== undefined) issue('percent', 'Set only a fixed amount');
    } else {
      if (value.percent === null || value.percent === undefined) issue('percent', 'Percentage is required');
      if (value.fixedAmount !== null && value.fixedAmount !== undefined)
        issue('fixedAmount', 'Set only a percentage');
    }
    if (value.endDate < value.startDate) issue('endDate', 'End date must be on or after start date');
    if (value.scope === 'PRODUCT' && !value.productIds.length)
      issue('productIds', 'Choose at least one product');
    if (value.scope === 'SUBSCRIPTION' && value.productIds.length)
      issue('productIds', 'Choose products only for product scope');
  });
