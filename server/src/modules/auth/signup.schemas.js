// Customer registration input; caller-supplied roles are discarded (PS-1).
import { z } from 'zod';
import { emailField, requiredText } from '../../lib/validation.js';
import { passwordSchema } from '../../lib/password.js';
export const signupSchema = z.object({
  name: requiredText('Name'),
  email: emailField(),
  password: passwordSchema,
});
