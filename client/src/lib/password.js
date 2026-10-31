// Client mirror of the account password rule (PS-1, PS-3, PS-5).
export function validatePassword(value) {
  const messages = [];
  if (value.length < 9) messages.push('Password must be more than 8 characters');
  if (!/[A-Z]/.test(value)) messages.push('Password must include an uppercase letter');
  if (!/[a-z]/.test(value)) messages.push('Password must include a lowercase letter');
  if (!/[^A-Za-z0-9\s]/.test(value)) messages.push('Password must include a special character');
  if (new TextEncoder().encode(value).length > 72) messages.push('Password must be at most 72 bytes');
  return messages.join('\n');
}
