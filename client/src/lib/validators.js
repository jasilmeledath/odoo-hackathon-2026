// Client validators: the same limits and messages as server/src/lib/validation.js.
// Each returns an error message, or '' when the value is fine.
const EMAIL_PATTERN =
  /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;

export const validateRequired = (value, label) => (String(value ?? '').trim() ? '' : `${label} is required`);

// Both dates are optional. When both are given, the end must not be before the start.
export const validateDateRange = (from, to) =>
  from && to && from > to ? 'To date must be on or after the from date' : '';

export const validateEmail = (value) => {
  if (!String(value ?? '').trim()) return 'Email is required';
  if (value.trim().length > 254) return 'Email is too long';
  return EMAIL_PATTERN.test(value.trim()) ? '' : 'Enter a valid email address';
};
