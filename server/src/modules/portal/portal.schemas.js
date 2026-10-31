// Customer portal filters use the same bounded pagination as staff lists (PS-26).
import { z } from 'zod';
import { InvoiceStatus, SubscriptionStatus } from '../../generated/prisma/enums.js';
import { idParamSchema } from '../../lib/validation.js';
import { listQuerySchema } from '../../lib/pagination.js';
const MAX_SEARCH_LENGTH = 100;
const portalListQuerySchema = listQuerySchema.extend({
  q: z.string().trim().max(MAX_SEARCH_LENGTH, 'Search must be at most 100 characters').optional(),
});
export const portalSubscriptionQuerySchema = portalListQuerySchema.extend({
  status: z.enum(SubscriptionStatus, { error: 'Choose a valid subscription status' }).optional(),
});
export const portalInvoiceQuerySchema = portalListQuerySchema.extend({
  status: z.enum(InvoiceStatus, { error: 'Choose a valid invoice status' }).optional(),
});

export const portalAddonSchema = z.object({
  isActive: z.boolean({ error: 'Choose whether the add-on is active' }),
});
export const portalAddonParamsSchema = idParamSchema.extend({ lineId: idParamSchema.shape.id });
