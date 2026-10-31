// Plan catalog filters validate calendar dates before querying PostgreSQL (PS-8).
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';
import { BillingPeriod } from '../../generated/prisma/enums.js';
import { requiredText, moneyField, dateField } from '../../lib/validation.js';

export const planListQuerySchema = listQuerySchema.extend({
  availableOn: dateField('Available on').optional(),
  isActive: z
    .enum(['true', 'false'], { error: 'Choose true or false' })
    .transform((value) => value === 'true')
    .optional(),
});

const MAX_PLAN_NAME = 120;
const MAX_QUANTITY = 2_147_483_647;
export const planSchema = z
  .object({
    name: requiredText('Name', MAX_PLAN_NAME),
    productId: z
      .number({ error: 'Choose an existing product' })
      .int('Choose an existing product')
      .positive('Choose an existing product')
      .max(MAX_QUANTITY, 'Choose an existing product'),
    price: moneyField('Price'),
    billingPeriod: z.enum(BillingPeriod, { error: 'Choose a valid billing period' }),
    minQuantity: z
      .number({ error: 'Minimum quantity is required' })
      .int('Minimum quantity must be a whole number')
      .min(1, 'Minimum quantity must be at least 1')
      .max(MAX_QUANTITY, 'Minimum quantity is too large'),
    startDate: dateField('Start date'),
    endDate: dateField('End date').nullable().optional(),
    closesAtExpiry: z.boolean().default(false),
    canCloseEarly: z.boolean().default(true),
    canPause: z.boolean().default(false),
    canRenew: z.boolean().default(true),
    isActive: z.boolean().default(true),
  })
  .superRefine((value, context) => {
    // PS-8: the final sale date cannot precede the first sale date.
    if (value.endDate && value.endDate < value.startDate)
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date must be on or after start date',
      });
  });
