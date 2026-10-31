// Client validators: the same limits and messages as server/src/lib/validation.js.
// Each returns an error message, or '' when the value is fine.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRequired = (value, label) => (String(value ?? '').trim() ? '' : `${label} is required`);

// Both dates are optional. When both are given, the end must not be before the start.
export const validateDateRange = (from, to) =>
  from && to && from > to ? 'To date must be on or after the from date' : '';

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

export const PRODUCT_TYPES = ['SOFTWARE', 'ADD_ON', 'SERVICE'];
export const MAX_PRODUCT_NAME = 120;
export const MAX_PRODUCT_NOTES = 1000;
export const MAX_PRICE_RUPEES = 10_000_000;
const MONEY_DECIMAL_PLACES = 2;

// PS-6: input is in rupees; conversion to whole paise happens only after validation.
export const validateProduct = (form) => {
  const fields = {};
  if (!form.name.trim()) fields.name = 'Name is required';
  else if (form.name.trim().length > MAX_PRODUCT_NAME) fields.name = 'Name must be at most 120 characters';
  if (!PRODUCT_TYPES.includes(form.type)) fields.type = 'Choose a valid product type';
  if (form.notes.trim().length > MAX_PRODUCT_NOTES) fields.notes = 'Notes must be at most 1000 characters';
  for (const [key, label] of [
    ['salesPrice', 'Sales price'],
    ['costPrice', 'Cost price'],
  ]) {
    const value = Number(form[key]);
    if (String(form[key]).trim() === '' || !Number.isFinite(value)) fields[key] = label + ' is required';
    else if (value < 0) fields[key] = label + ' cannot be negative';
    else if (value > MAX_PRICE_RUPEES) fields[key] = label + ' is too large';
    else if (Number(value.toFixed(MONEY_DECIMAL_PLACES)) !== value)
      fields[key] = label + ' must have at most 2 decimal places';
  }
  return fields;
};
