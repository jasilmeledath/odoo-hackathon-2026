// Query validation for finance summaries and renewals (PS-23, PS-24).
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';
import { dateField } from '../../lib/validation.js';

export const summaryQuerySchema = z
  .object({
    from: dateField('From date').optional(),
    to: dateField('To date').optional(),
  })
  .refine(({ from, to }) => !from || !to || from <= to, {
    path: ['to'],
    message: 'To date must be on or after the from date',
  });

export const renewalsQuerySchema = listQuerySchema;
