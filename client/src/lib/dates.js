// The calendar date one billing period after a YYYY-MM-DD start. A month that is too
// short clamps to its last day, so 31 Jan plus a month is 28 or 29 Feb.
export const addBillingPeriod = (startDate, billingPeriod) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '')) return '';
  const [year, month, day] = startDate.split('-').map(Number);
  const months = { MONTHLY: 1, YEARLY: 12 }[billingPeriod];
  const result = new Date(Date.UTC(year, month - 1, day));
  if (months) {
    const target = new Date(Date.UTC(year, month - 1 + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    result.setTime(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(day, lastDay)));
  } else {
    result.setUTCDate(result.getUTCDate() + (billingPeriod === 'WEEKLY' ? 7 : 1));
  }
  return result.toISOString().slice(0, 10);
};

// Calendar dates in the subscription workflow follow the team's IST business day.
export const today = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
