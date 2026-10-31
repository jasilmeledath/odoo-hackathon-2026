// Zod field rules shared by every module. Each module keeps its own schemas in
// <module>.schemas.js, built from these. client/src/lib/validators.js mirrors the
// limits and messages.
import { z } from 'zod';

const MAX_MONEY_PAISE = 1_000_000_000; // Rs 1 crore: leaves room below the INTEGER column limit

const MAX_DATABASE_ID = 2_147_483_647; // PostgreSQL SERIAL identifiers

export const idParamSchema = z.object({
  id: z.coerce
    .number({ error: 'Invalid id' })
    .int()
    .positive('Invalid id')
    .max(MAX_DATABASE_ID, 'Invalid id'),
});

export const requiredText = (label, max = 120) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

export const optionalText = (label, max = 500) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`).optional().nullable();

export const emailField = () =>
  z
    .string({ error: 'Email is required' })
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .pipe(z.email('Enter a valid email address'));

// Money travels through the API as whole paise.
export const moneyField = (label) =>
  z
    .number({ error: `${label} is required` })
    .int(`${label} must be a whole number of paise`)
    .min(0, `${label} cannot be negative`)
    .max(MAX_MONEY_PAISE, `${label} is too large`);

// A required calendar date sent as YYYY-MM-DD.
export const dateField = (label) =>
  z.iso.date({ error: `${label} must be a valid date` }).transform((value) => new Date(value));
