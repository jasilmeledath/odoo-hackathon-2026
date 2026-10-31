// Product catalog query validation; string booleans preserve false (PS-6).
import { z } from 'zod';
import { ProductType } from '../../generated/prisma/enums.js';
import { listQuerySchema } from '../../lib/pagination.js';

export const productListQuerySchema = listQuerySchema.extend({
  type: z.enum(ProductType, { error: 'Choose a valid product type' }).optional(),
  isActive: z
    .enum(['true', 'false'], { error: 'Choose true or false' })
    .transform((value) => value === 'true')
    .optional(),
});
