// Monthly revenue report aggregated by PostgreSQL (PS-24).
import { today, toIsoDate } from '../../lib/dates.js';
import { prisma } from '../../lib/prisma.js';

const MONTHS_IN_DEFAULT_REPORT = 12;
const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  timeZone: 'UTC',
});

const startOfMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const getReportPeriod = ({ from, to }) => {
  const currentDate = today();
  const currentMonth = startOfMonth(currentDate);
  const defaultFrom = new Date(
    Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - MONTHS_IN_DEFAULT_REPORT + 1, 1),
  );
  return { from: from ?? defaultFrom, to: to ?? currentDate };
};

const enumerateMonths = (from, to) => {
  const months = [];
  const currentMonth = startOfMonth(from);
  const finalMonth = startOfMonth(to);
  while (currentMonth <= finalMonth) {
    months.push(new Date(currentMonth));
    currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
  }
  return months;
};

export const getMonthlyRevenue = async (query) => {
  const period = getReportPeriod(query);
  const monthlyTotals = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', payment_date), 'YYYY-MM') AS month,
      SUM(amount) AS amount
    FROM payments
    WHERE payment_date >= ${period.from}::date
      AND payment_date <= ${period.to}::date
    GROUP BY DATE_TRUNC('month', payment_date)
    ORDER BY DATE_TRUNC('month', payment_date)
  `;
  const totalsByMonth = new Map(monthlyTotals.map(({ month, amount }) => [month, Number(amount)]));

  return {
    period: { from: toIsoDate(period.from), to: toIsoDate(period.to) },
    items: enumerateMonths(period.from, period.to).map((month) => {
      const monthKey = toIsoDate(month).slice(0, 7);
      return {
        month: monthKey,
        label: MONTH_LABEL_FORMAT.format(month),
        amount: totalsByMonth.get(monthKey) ?? 0,
      };
    }),
  };
};
