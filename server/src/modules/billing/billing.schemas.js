// Billing dates are determined by the server's IST business day, never by the caller.
import { z } from 'zod';
export const billingRunSchema = z.object({}).strict().default({});
