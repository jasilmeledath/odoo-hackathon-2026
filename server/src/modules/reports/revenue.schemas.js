// Date filters for the revenue-by-month report (PS-24).
import { z } from 'zod';
import { dateField } from '../../lib/validation.js';

export const revenueQuerySchema = z
  .object({
    from: dateField('From date').optional(),
    to: dateField('To date').optional(),
  })
  .refine(({ from, to }) => !from || !to || from <= to, {
    path: ['to'],
    message: 'To date must be on or after the from date',
  });
