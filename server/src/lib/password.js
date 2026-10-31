// Shared account password rules (PS-1, PS-3, PS-5).
import { z } from 'zod';
export const passwordSchema = z.string({ error: 'Password is required' }).superRefine((value, context) => {
  const messages = [];
  if (value.length < 9) messages.push('Password must be more than 8 characters');
  if (!/[A-Z]/.test(value)) messages.push('Password must include an uppercase letter');
  if (!/[a-z]/.test(value)) messages.push('Password must include a lowercase letter');
  if (!/[^A-Za-z0-9\s]/.test(value)) messages.push('Password must include a special character');
  if (Buffer.byteLength(value, 'utf8') > 72) messages.push('Password must be at most 72 bytes');
  if (messages.length) context.addIssue({ code: 'custom', message: messages.join('\n') });
});
