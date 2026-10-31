// Product catalog query validation; string booleans preserve false (PS-6).
import { z } from 'zod';
import { ProductType } from '../../generated/prisma/enums.js';
import { requiredText, optionalText, moneyField } from '../../lib/validation.js';
import { listQuerySchema } from '../../lib/pagination.js';

export const productListQuerySchema = listQuerySchema.extend({
  type: z.enum(ProductType, { error: 'Choose a valid product type' }).optional(),
  isActive: z
    .enum(['true', 'false'], { error: 'Choose true or false' })
    .transform((value) => value === 'true')
    .optional(),
});

const MAX_PRODUCT_NAME = 120;
const MAX_PRODUCT_NOTES = 1000;
export const productSchema = z.object({
  name: requiredText('Name', MAX_PRODUCT_NAME),
  type: z.enum(ProductType, { error: 'Choose a valid product type' }),
  salesPrice: moneyField('Sales price'),
  costPrice: moneyField('Cost price'),
  notes: optionalText('Notes', MAX_PRODUCT_NOTES),
  isActive: z.boolean().default(true),
});
