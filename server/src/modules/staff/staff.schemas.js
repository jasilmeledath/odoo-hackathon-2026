// Admin staff input rules; public requests cannot set a role (PS-5).
import { z } from 'zod';
import { requiredText, emailField } from '../../lib/validation.js';
import { passwordSchema } from '../../lib/password.js';
const staffFields = { name: requiredText('Name'), email: emailField(), isActive: z.boolean().default(true) };
export const createStaffSchema = z.object({ ...staffFields, password: passwordSchema });
export const updateStaffSchema = z.object({ ...staffFields, password: passwordSchema.optional() });
