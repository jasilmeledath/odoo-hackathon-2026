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

export const BILLING_PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
export const MAX_PLAN_NAME = 120;
export const MAX_PLAN_QUANTITY = 2_147_483_647;
export const MAX_PLAN_PRICE_RUPEES = 10_000_000;
const PLAN_PRICE_DECIMALS = 2;
const isCalendarDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

// PS-8: mirror server date/quantity/price limits before conversion to API types.
export const validatePlan = (form) => {
  const fields = {};
  if (!form.name.trim()) fields.name = 'Name is required';
  else if (form.name.trim().length > MAX_PLAN_NAME) fields.name = 'Name must be at most 120 characters';
  if (
    !Number.isInteger(Number(form.productId)) ||
    Number(form.productId) < 1 ||
    Number(form.productId) > MAX_PLAN_QUANTITY
  )
    fields.productId = 'Choose an existing product';
  if (!BILLING_PERIODS.includes(form.billingPeriod)) fields.billingPeriod = 'Choose a valid billing period';
  const price = Number(form.price);
  if (String(form.price).trim() === '' || !Number.isFinite(price)) fields.price = 'Price is required';
  else if (price < 0) fields.price = 'Price cannot be negative';
  else if (price > MAX_PLAN_PRICE_RUPEES) fields.price = 'Price is too large';
  else if (Number(price.toFixed(PLAN_PRICE_DECIMALS)) !== price)
    fields.price = 'Price must have at most 2 decimal places';
  const quantity = Number(form.minQuantity);
  if (String(form.minQuantity).trim() === '' || !Number.isFinite(quantity))
    fields.minQuantity = 'Minimum quantity is required';
  else if (!Number.isInteger(quantity)) fields.minQuantity = 'Minimum quantity must be a whole number';
  else if (quantity < 1) fields.minQuantity = 'Minimum quantity must be at least 1';
  else if (quantity > MAX_PLAN_QUANTITY) fields.minQuantity = 'Minimum quantity is too large';
  if (!isCalendarDate(form.startDate)) fields.startDate = 'Start date must be a valid date';
  if (form.endDate && !isCalendarDate(form.endDate)) fields.endDate = 'End date must be a valid date';
  else if (form.endDate && form.endDate < form.startDate)
    fields.endDate = 'End date must be on or after start date';
  return fields;
};

export const MAX_TEMPLATE_NAME = 120;
export const MAX_TEMPLATE_NOTES = 1000;
export const MAX_TEMPLATE_LINES = 100;
export const MAX_TEMPLATE_INTEGER = 2_147_483_647;
export const validateInteger = (input, label, minimum = 1) => {
  const value = Number(input);
  if (input === null || input === undefined || String(input).trim() === '' || !Number.isFinite(value))
    return label + ' is required';
  if (!Number.isInteger(value)) return label + ' must be a whole number';
  if (value < minimum) return label + ' must be at least ' + minimum;
  if (value > MAX_TEMPLATE_INTEGER) return label + ' is too large';
  return '';
};

// PS-11: validate references and quantities; current prices are read-only.
export const validateTemplate = (form) => {
  const fields = {};
  if (!form.name.trim()) fields.name = 'Name is required';
  else if (form.name.trim().length > MAX_TEMPLATE_NAME) fields.name = 'Name must be at most 120 characters';
  if (validateInteger(form.planId, 'Plan')) fields.planId = 'Choose an existing plan';
  const validityError = validateInteger(form.validityDays, 'Validity days');
  if (validityError) fields.validityDays = validityError;
  if (form.notes.trim().length > MAX_TEMPLATE_NOTES) fields.notes = 'Notes must be at most 1000 characters';
  if (!form.lines.length) fields.lines = 'Add at least one line';
  else if (form.lines.length > MAX_TEMPLATE_LINES) fields.lines = 'Use at most 100 lines';
  form.lines.forEach((line, index) => {
    if (validateInteger(line.productId, 'Product'))
      fields['lines.' + index + '.productId'] = 'Choose an existing product';
    if (line.variantId && validateInteger(line.variantId, 'Variant'))
      fields['lines.' + index + '.variantId'] = 'Choose a variant of this product';
    const quantityError = validateInteger(line.quantity, 'Quantity');
    if (quantityError) fields['lines.' + index + '.quantity'] = quantityError;
  });
  return fields;
};
