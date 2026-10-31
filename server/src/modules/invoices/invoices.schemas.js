// Zod schemas for the invoice routes (PS-17, PS-22). Limits and messages are
// mirrored in client/src/lib/validators.js where a form needs them.
import { InvoiceStatus } from '../../generated/prisma/enums.js';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';
import { dateField } from '../../lib/validation.js';

const booleanText = z
  .enum(['true', 'false'], { error: 'Use true or false' })
  .transform((value) => value === 'true');

export const invoiceListQuerySchema = listQuerySchema
  .extend({
    status: z.enum(InvoiceStatus, { error: 'Choose a valid invoice status' }).optional(),
    isOverdue: booleanText.optional(),
    customerId: z.coerce.number({ error: 'Invalid customer' }).int().positive('Invalid customer').optional(),
    from: dateField('From date').optional(),
    to: dateField('To date').optional(),
  })
  .refine(({ from, to }) => !from || !to || from <= to, {
    path: ['to'],
    message: 'To date must be on or after the from date',
  });
