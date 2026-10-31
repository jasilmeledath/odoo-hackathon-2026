// Client validators: the same limits and messages as server/src/lib/validation.js.
// Each returns an error message, or '' when the value is fine.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRequired = (value, label) => (String(value ?? '').trim() ? '' : `${label} is required`);

export const validateEmail = (value) => {
  if (!String(value ?? '').trim()) return 'Email is required';
  return EMAIL_PATTERN.test(value.trim()) ? '' : 'Enter a valid email address';
};

export const MAX_CATALOG_RULE_NAME = 60;
export const MAX_TAX_RATE = 100;
export const MAX_PAYMENT_DUE_DAYS = 2_147_483_647;
const TAX_DECIMAL_PLACES = 2;

// PS-10, PS-12: keep these limits/messages in sync with the catalog schemas.
export const validateCatalogRule = (form, isTax) => {
  const fields = {};
  const name = form.name.trim();
  if (!name) fields.name = 'Name is required';
  else if (name.length > MAX_CATALOG_RULE_NAME) fields.name = 'Name must be at most 60 characters';
  const key = isTax ? 'ratePercent' : 'dueDays';
  const value = Number(form[key]);
  if (String(form[key]).trim() === '' || !Number.isFinite(value))
    fields[key] = isTax ? 'Rate is required' : 'Due days is required';
  else if (isTax && (value < 0 || value > MAX_TAX_RATE)) fields[key] = 'Rate must be between 0 and 100';
  else if (isTax && Number(value.toFixed(TAX_DECIMAL_PLACES)) !== value)
    fields[key] = 'Rate must have at most 2 decimal places';
  else if (!isTax && !Number.isInteger(value)) fields[key] = 'Due days must be a whole number';
  else if (!isTax && value < 0) fields[key] = 'Due days cannot be negative';
  else if (!isTax && value > MAX_PAYMENT_DUE_DAYS) fields[key] = 'Due days is too large';
  return fields;
};
