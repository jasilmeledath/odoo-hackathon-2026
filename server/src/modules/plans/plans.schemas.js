// Plan catalog filters validate calendar dates before querying PostgreSQL (PS-8).
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';
import { dateField } from '../../lib/validation.js';

export const planListQuerySchema = listQuerySchema.extend({
  availableOn: dateField('Available on').optional(),
  isActive: z
    .enum(['true', 'false'], { error: 'Choose true or false' })
    .transform((value) => value === 'true')
    .optional(),
});
