// Customer directory query and input validation (PS-12).
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';
import { requiredText, optionalText, emailField } from '../../lib/validation.js';
export const customerListQuerySchema = listQuerySchema.extend({
  isActive: z
    .enum(['true', 'false'], { error: 'Choose true or false' })
    .transform((value) => value === 'true')
    .optional(),
});

export const customerSchema = z.object({
  name: requiredText('Name'),
  email: emailField(),
  companyName: optionalText('Company', 160),
  phone: z
    .string()
    .trim()
    .regex(/^$|^[6-9][0-9]{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .nullable(),
  address: optionalText('Address', 500),
  isActive: z.boolean().default(true),
});
