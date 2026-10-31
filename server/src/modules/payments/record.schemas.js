// Recording accepts positive paise and no future business dates (PS-21).
import { z } from 'zod';
import { PaymentMethod } from '../../generated/prisma/enums.js';
import { dateField, moneyField, idParamSchema, optionalText } from '../../lib/validation.js';
import { today } from '../../lib/dates.js';
export const recordPaymentSchema = z.object({
  invoiceId: idParamSchema.shape.id,
  method: z.enum(PaymentMethod, { error: 'Choose a valid payment method' }),
  amount: moneyField('Amount').positive('Amount must be above zero'),
  paymentDate: dateField('Payment date').refine(
    (date) => date <= today(),
    'Payment date cannot be in the future',
  ),
  note: optionalText('Note', 500),
});
