// Money helpers. All amounts are whole paise, so totals never pick up floating
// point errors. Percentages are applied here and rounded once per line.

const PERIODS_PER_YEAR = { DAILY: 365, WEEKLY: 52, MONTHLY: 12, YEARLY: 1 };

export const applyPercent = (amount, percent) => Math.round((amount * percent) / 100);

// One subscription's share of monthly recurring revenue (PS-23).
export const toMonthlyAmount = (amount, billingPeriod) =>
  Math.round((amount * PERIODS_PER_YEAR[billingPeriod]) / 12);
