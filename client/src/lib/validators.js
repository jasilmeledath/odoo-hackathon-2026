// Client validators: the same limits and messages as server/src/lib/validation.js.
// Each returns an error message, or '' when the value is fine.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRequired = (value, label) => (String(value ?? '').trim() ? '' : `${label} is required`);

export const validateEmail = (value) => {
  if (!String(value ?? '').trim()) return 'Email is required';
  return EMAIL_PATTERN.test(value.trim()) ? '' : 'Enter a valid email address';
};
