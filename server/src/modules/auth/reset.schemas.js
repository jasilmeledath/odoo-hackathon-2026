// Password recovery input rules (PS-3).
import { z } from 'zod';
import { emailField } from '../../lib/validation.js';
import { passwordSchema } from '../../lib/password.js';
export const forgotPasswordSchema = z.object({ email: emailField() });
export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'Reset link is invalid or expired'),
  password: passwordSchema,
});
