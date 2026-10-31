// Calendar-date helpers. Dates such as dueDate are stored at 00:00 UTC, so
// "2026-10-31" means the same day everywhere. "Today" is the business day in IST.

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const toDateOnly = (value) => {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const today = () => toDateOnly(Date.now() + IST_OFFSET_MS);

export const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS);

export const toIsoDate = (date) => date.toISOString().slice(0, 10);

const lastDayOfMonth = (year, month) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const addMonths = (date, months, anchorDay) => {
  const monthIndex = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  return new Date(Date.UTC(year, month, Math.min(anchorDay, lastDayOfMonth(year, month))));
};

// Next billing date after `date`. Pass the subscription's start day as anchorDay
// so a plan started on 31 Jan bills on 28 Feb and then on 31 Mar, not 28 Mar.
export const addPeriod = (date, billingPeriod, anchorDay = date.getUTCDate()) => {
  switch (billingPeriod) {
    case 'DAILY':
      return addDays(date, 1);
    case 'WEEKLY':
      return addDays(date, 7);
    case 'MONTHLY':
      return addMonths(date, 1, anchorDay);
    case 'YEARLY':
      return addMonths(date, 12, anchorDay);
    default:
      throw new Error(`Unknown billing period: ${billingPeriod}`);
  }
};
