// Tax write validation mirrors the client and the NUMERIC(5,2) column (PS-10).
import { z } from 'zod';
import { requiredText } from '../../lib/validation.js';

const MAX_NAME_LENGTH = 60;
const MAX_RATE = 100;
const RATE_STEP = 0.01;

export const taxSchema = z.object({
  name: requiredText('Name', MAX_NAME_LENGTH),
  ratePercent: z
    .number({ error: 'Rate is required' })
    .min(0, 'Rate must be between 0 and 100')
    .max(MAX_RATE, 'Rate must be between 0 and 100')
    .multipleOf(RATE_STEP, 'Rate must have at most 2 decimal places'),
  isActive: z.boolean().default(true),
});
