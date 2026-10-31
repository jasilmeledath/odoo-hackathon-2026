// PS-15: indexed, paginated billing queue with database-side subtotal estimates.
import { today } from '../../lib/dates.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import { dueSubscriptionsWhere } from './billingRun.service.js';

export const listDueSubscriptions = async ({ q, ...pagination }) => {
  const where = {
    ...dueSubscriptionsWhere(today()),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: 'insensitive' } },
            { customer: { is: { name: { contains: q, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };
  const [page, totals] = await Promise.all([
    paginate(
      prisma.subscription,
      {
        where,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          number: true,
          nextInvoiceDate: true,
          recurringAmount: true,
          customer: { select: { name: true } },
          plan: { select: { name: true } },
        },
      },
      pagination,
    ),
    prisma.subscription.aggregate({ where, _sum: { recurringAmount: true } }),
  ]);
  return { ...page, expectedSubtotalAmount: totals._sum.recurringAmount ?? 0 };
};
