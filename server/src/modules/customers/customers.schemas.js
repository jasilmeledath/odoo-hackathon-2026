// Customer input validation (PS-12).
import { z } from 'zod';
import { requiredText, optionalText, emailField } from '../../lib/validation.js';
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
