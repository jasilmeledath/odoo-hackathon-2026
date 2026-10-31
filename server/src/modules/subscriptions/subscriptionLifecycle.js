// Resume at the next scheduled boundary after paused time (A-18).
import { addPeriod, toDateOnly } from '../../lib/dates.js';

export const nextBillingDateAfterPause = (nextInvoiceDate, startDate, billingPeriod, resumeDate) => {
  if (!nextInvoiceDate) return null;
  const anchorDay = startDate.getUTCDate();
  let nextDate = toDateOnly(nextInvoiceDate);
  while (nextDate < toDateOnly(resumeDate)) {
    nextDate = addPeriod(nextDate, billingPeriod, anchorDay);
  }
  return nextDate;
};
