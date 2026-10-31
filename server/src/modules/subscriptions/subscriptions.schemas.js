// Subscription list query validation (PS-12, PS-13).
import { SubscriptionStatus } from '../../generated/prisma/enums.js';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';
import { dateField } from '../../lib/validation.js';

export const subscriptionRenewSchema = z.object({ expiryDate: dateField('Expiry date') });

export const subscriptionListQuerySchema = listQuerySchema.extend({
  status: z.enum(SubscriptionStatus, { error: 'Choose a valid subscription status' }).optional(),
  customerId: z.coerce.number({ error: 'Invalid customer' }).int().positive('Invalid customer').optional(),
  planId: z.coerce.number({ error: 'Invalid plan' }).int().positive('Invalid plan').optional(),
});
