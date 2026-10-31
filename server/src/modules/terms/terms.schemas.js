// Payment-term writes preserve the database's nonnegative INTEGER domain (PS-12).
import { z } from 'zod';
import { requiredText } from '../../lib/validation.js';

const MAX_DUE_DAYS = 2_147_483_647;
const MAX_NAME_LENGTH = 60;

export const paymentTermSchema = z.object({
  name: requiredText('Name', MAX_NAME_LENGTH),
  dueDays: z
    .number({ error: 'Due days is required' })
    .int('Due days must be a whole number')
    .min(0, 'Due days cannot be negative')
    .max(MAX_DUE_DAYS, 'Due days is too large'),
  isActive: z.boolean().default(true),
});
