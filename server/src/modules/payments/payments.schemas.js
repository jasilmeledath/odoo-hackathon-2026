// Payment filters combine and validate date bounds (PS-21).
import { z } from 'zod';
import { PaymentMethod } from '../../generated/prisma/enums.js';
import { listQuerySchema } from '../../lib/pagination.js';
import { dateField } from '../../lib/validation.js';
export const paymentListSchema = listQuerySchema
  .extend({
    method: z.enum(PaymentMethod, { error: 'Choose a valid payment method' }).optional(),
    from: dateField('From date').optional(),
    to: dateField('To date').optional(),
  })
  .refine((value) => !value.from || !value.to || value.to >= value.from, {
    path: ['to'],
    message: 'To date must be on or after from date',
  });
