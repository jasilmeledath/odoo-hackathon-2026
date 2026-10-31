// Shared recurring totals for staff edits and customer add-on changes (PS-12, PS-27).
import { toMonthlyAmount } from '../../lib/money.js';
import { HttpError } from '../../lib/errors.js';
const MAX_DATABASE_INTEGER = 2_147_483_647;
export function calculateSubscriptionAmounts(lines, billingPeriod) {
  const recurringAmount = lines
    .filter((line) => line.isActive !== false)
    .reduce((total, line) => total + line.amount, 0);
  const monthlyRecurringAmount = toMonthlyAmount(recurringAmount, billingPeriod);
  if (
    ![recurringAmount, monthlyRecurringAmount].every(
      (value) => Number.isSafeInteger(value) && value >= 0 && value <= MAX_DATABASE_INTEGER,
    )
  )
    throw new HttpError(400, 'The subscription total is too large', {
      lines: 'Reduce line quantities or prices',
    });
  return { recurringAmount, monthlyRecurringAmount };
}
