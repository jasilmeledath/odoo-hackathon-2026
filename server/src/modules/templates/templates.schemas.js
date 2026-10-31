// Template inputs contain references and quantities, never price snapshots (PS-11).
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';
import { idParamSchema, optionalText, requiredText } from '../../lib/validation.js';

export const MAX_TEMPLATE_LINES = 100;
export const MAX_TEMPLATE_INTEGER = 2_147_483_647;
const reference = (label) =>
  z
    .number({ error: 'Choose an existing ' + label })
    .int()
    .positive()
    .max(MAX_TEMPLATE_INTEGER);
const positiveInteger = (label) =>
  z
    .number({ error: label + ' is required' })
    .int(label + ' must be a whole number')
    .min(1, label + ' must be at least 1')
    .max(MAX_TEMPLATE_INTEGER, label + ' is too large');

export const templateSchema = z.object({
  name: requiredText('Name', 120),
  planId: reference('plan'),
  validityDays: positiveInteger('Validity days'),
  notes: optionalText('Notes', 1000),
  isActive: z.boolean().default(true),
  lines: z
    .array(
      z
        .object({
          productId: reference('product'),
          variantId: idParamSchema.shape.id.nullable().optional(),
          quantity: positiveInteger('Quantity'),
        })
        .strict(),
    )
    .min(1, 'Add at least one line')
    .max(MAX_TEMPLATE_LINES, 'Use at most 100 lines'),
});

export const templateListQuerySchema = listQuerySchema.extend({
  isActive: z
    .enum(['true', 'false'], { error: 'Choose true or false' })
    .transform((value) => value === 'true')
    .optional(),
});
