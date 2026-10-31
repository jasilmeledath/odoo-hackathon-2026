// Subscription list query validation (PS-12, PS-13).
import { SubscriptionStatus } from '../../generated/prisma/enums.js';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';
import { dateField, optionalText } from '../../lib/validation.js';

const MAX_ID = 2_147_483_647;
const positiveId = z.number().int().positive().max(MAX_ID);
const subscriptionLineSchema = z.object({
  productId: positiveId,
  variantId: positiveId.nullable().optional(),
  taxId: positiveId.nullable().optional(),
  quantity: z.number().int().min(1).max(MAX_ID),
});

export const subscriptionWriteSchema = z
  .object({
    customerId: positiveId,
    planId: positiveId,
    paymentTermId: positiveId,
    startDate: dateField('Start date'),
    expiryDate: dateField('Expiry date'),
    notes: optionalText('Notes', 1000),
    lines: z.array(subscriptionLineSchema).min(1, 'Add at least one subscription line').max(100),
  })
  .superRefine((value, context) => {
    if (value.expiryDate <= value.startDate) {
      context.addIssue({
        code: 'custom',
        path: ['expiryDate'],
        message: 'Expiry date must be after start date',
      });
    }
  });

export const subscriptionRenewSchema = z.object({ expiryDate: dateField('Expiry date') });

export const subscriptionListQuerySchema = listQuerySchema.extend({
  status: z.enum(SubscriptionStatus, { error: 'Choose a valid subscription status' }).optional(),
  customerId: z.coerce.number({ error: 'Invalid customer' }).int().positive('Invalid customer').optional(),
  planId: z.coerce.number({ error: 'Invalid plan' }).int().positive('Invalid plan').optional(),
});
