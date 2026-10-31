// Discount list states are derived, never stored (PS-19).
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const DISCOUNT_STATES = ['ACTIVE', 'EXPIRED', 'USED_UP', 'SCHEDULED', 'INACTIVE'];
export const discountListQuerySchema = listQuerySchema.extend({
  state: z.enum(DISCOUNT_STATES, { error: 'Choose a valid discount state' }).optional(),
});
