// Login input rules (PS-2); passwords are never trimmed or normalized.
import { z } from 'zod';
import { emailField } from '../../lib/validation.js';

export const loginSchema = z.object({
  email: emailField(),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required')
    .max(72, 'Password must be at most 72 characters'),
});
