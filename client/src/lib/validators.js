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

// Shared currency-input validation prevents divergent product, plan and variant limits.
export const validateRupeePrice = (input, label) => {
  const value = Number(input);
  if (input === null || input === undefined || String(input).trim() === '' || !Number.isFinite(value))
    return label + ' is required';
  if (value < 0) return label + ' cannot be negative';
  if (value > MAX_PRICE_RUPEES) return label + ' is too large';
  if (Number(value.toFixed(MONEY_DECIMAL_PLACES)) !== value)
    return label + ' must have at most 2 decimal places';
  return '';
};

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
    const error = validateRupeePrice(form[key], label);
    if (error) fields[key] = error;
  }
  return fields;
};

export const BILLING_PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
export const MAX_PLAN_NAME = 120;
export const MAX_PLAN_QUANTITY = 2_147_483_647;
export const MAX_PLAN_PRICE_RUPEES = 10_000_000;
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
  const priceError = validateRupeePrice(form.price, 'Price');
  if (priceError) fields.price = priceError;
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

export const MAX_VARIANT_TEXT = 60;
export const validateVariant = (form) => {
  const fields = {};
  for (const [key, label] of [
    ['attribute', 'Attribute'],
    ['value', 'Value'],
  ]) {
    if (!form[key].trim()) fields[key] = label + ' is required';
    else if (form[key].trim().length > MAX_VARIANT_TEXT)
      fields[key] = label + ' must be at most 60 characters';
  }
  const priceError = validateRupeePrice(form.extraPrice, 'Extra price');
  if (priceError) fields.extraPrice = priceError;
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

export const DISCOUNT_TYPES = ['FIXED', 'PERCENT'];
export const DISCOUNT_SCOPES = ['SUBSCRIPTION', 'PRODUCT'];
export const DISCOUNT_STATES = ['ACTIVE', 'EXPIRED', 'USED_UP', 'SCHEDULED', 'INACTIVE'];
export const MAX_DISCOUNT_NAME = 120;
export const MAX_DISCOUNT_PRODUCTS = 100;
export const MAX_DISCOUNT_INTEGER = 2_147_483_647;
export const MAX_DISCOUNT_PERCENTAGE = 100;
const PERCENT_DECIMAL_PLACES = 2;

// PS-19: mirror server rules before converting rupee values into whole paise.
export const validateDiscount = (form, usageCount = 0) => {
  const fields = {};
  if (!form.name.trim()) fields.name = 'Name is required';
  else if (form.name.trim().length > MAX_DISCOUNT_NAME) fields.name = 'Name must be at most 120 characters';
  if (!DISCOUNT_TYPES.includes(form.type)) fields.type = 'Choose a valid discount type';
  if (!DISCOUNT_SCOPES.includes(form.scope)) fields.scope = 'Choose a valid discount scope';
  if (form.type === 'FIXED') {
    const error = validateRupeePrice(form.fixedAmount, 'Fixed amount');
    if (error) fields.fixedAmount = error;
    else if (Number(form.fixedAmount) <= 0) fields.fixedAmount = 'Fixed amount must be greater than 0';
  } else {
    const percent = Number(form.percent);
    if (String(form.percent).trim() === '' || !Number.isFinite(percent))
      fields.percent = 'Percentage is required';
    else if (percent <= 0) fields.percent = 'Percentage must be greater than 0';
    else if (percent > MAX_DISCOUNT_PERCENTAGE) fields.percent = 'Percentage must be at most 100';
    else if (Number(percent.toFixed(PERCENT_DECIMAL_PLACES)) !== percent)
      fields.percent = 'Percentage must have at most 2 decimal places';
  }
  const minimumError = validateRupeePrice(form.minPurchaseAmount, 'Minimum purchase');
  if (minimumError) fields.minPurchaseAmount = minimumError;
  const quantityError = validateInteger(form.minQuantity, 'Minimum quantity', 0);
  if (quantityError) fields.minQuantity = quantityError;
  if (!isCalendarDate(form.startDate)) fields.startDate = 'Start date must be a valid date';
  if (!isCalendarDate(form.endDate)) fields.endDate = 'End date must be a valid date';
  else if (form.endDate < form.startDate) fields.endDate = 'End date must be on or after start date';
  if (form.usageLimit.trim()) {
    const limitError = validateInteger(form.usageLimit, 'Usage limit');
    if (limitError) fields.usageLimit = limitError;
    else if (Number(form.usageLimit) < usageCount)
      fields.usageLimit = 'Usage limit cannot be below the current usage count';
  }
  if (form.scope === 'PRODUCT' && !form.products.length) fields.productIds = 'Choose at least one product';
  else if (form.products.length > MAX_DISCOUNT_PRODUCTS) fields.productIds = 'Choose at most 100 products';
  return fields;
};
