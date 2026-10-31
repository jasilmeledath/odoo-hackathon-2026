// Database-backed finance summaries and renewal lists (PS-23, PS-24).
import { addDays, today, toIsoDate } from '../../lib/dates.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

const DAYS_AHEAD_FOR_RENEWAL = 30;
const OVERDUE_LIST_LIMIT = 10;

const getSummaryPeriod = ({ from, to }) => {
  const businessDate = today();
  return {
    from: from ?? new Date(Date.UTC(businessDate.getUTCFullYear(), businessDate.getUTCMonth(), 1)),
    to: to ?? businessDate,
  };
};

const subtractPaidAmount = ({ totalAmount, paidAmount } = {}) => (totalAmount ?? 0) - (paidAmount ?? 0);

export const getFinanceSummary = async (query) => {
  const period = getSummaryPeriod(query);
  const currentDate = today();
  const [
    activeSubscriptions,
    activeSubscriptionCount,
    invoicesInPeriod,
    outstandingInvoices,
    overdueInvoices,
    paymentsInPeriod,
    overdueList,
  ] = await Promise.all([
    prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { monthlyRecurringAmount: true },
    }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.invoice.aggregate({
      where: { status: { not: 'CANCELED' }, issueDate: { gte: period.from, lte: period.to } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'CONFIRMED', dueDate: { lt: currentDate } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    prisma.payment.aggregate({
      where: { paymentDate: { gte: period.from, lte: period.to } },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: { status: 'CONFIRMED', dueDate: { lt: currentDate } },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
      take: OVERDUE_LIST_LIMIT,
      select: {
        id: true,
        number: true,
        billingName: true,
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
      },
    }),
  ]);

  return {
    period: { from: toIsoDate(period.from), to: toIsoDate(period.to) },
    activeSubscriptionCount,
    monthlyRecurringAmount: activeSubscriptions._sum.monthlyRecurringAmount ?? 0,
    invoicedAmount: invoicesInPeriod._sum.totalAmount ?? 0,
    revenueAmount: paymentsInPeriod._sum.amount ?? 0,
    outstandingAmount: subtractPaidAmount(outstandingInvoices._sum),
    overdueAmount: subtractPaidAmount(overdueInvoices._sum),
    overdueInvoices: overdueList.map((invoice) => ({
      ...invoice,
      balanceAmount: invoice.totalAmount - invoice.paidAmount,
    })),
  };
};

const buildRenewalConditions = (query, currentDate, throughDate) => {
  const conditions = [
    { status: 'ACTIVE', expiryDate: { lte: throughDate } },
    {
      OR: [
        { expiryDate: { gte: currentDate } },
        { plan: { is: { closesAtExpiry: false } } },
      ],
    },
  ];
  if (query.q) {
    conditions.push({
      OR: [
        { number: { contains: query.q, mode: 'insensitive' } },
        {
          customer: {
            is: {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { companyName: { contains: query.q, mode: 'insensitive' } },
              ],
            },
          },
        },
        { plan: { is: { name: { contains: query.q, mode: 'insensitive' } } } },
      ],
    });
  }
  return conditions;
};

export const listRenewals = async (query) => {
  const currentDate = today();
  const throughDate = addDays(currentDate, DAYS_AHEAD_FOR_RENEWAL);
  return paginate(
    prisma.subscription,
    {
      where: { AND: buildRenewalConditions(query, currentDate, throughDate) },
      select: {
        id: true,
        number: true,
        expiryDate: true,
        recurringAmount: true,
        customer: { select: { id: true, name: true, companyName: true } },
        plan: { select: { id: true, name: true, canRenew: true, closesAtExpiry: true } },
      },
      orderBy: [{ expiryDate: 'asc' }, { id: 'asc' }],
    },
    query,
  );
};
