// Invoice rules and queries (PS-17, PS-22). Routes call these functions and
// hold no rules of their own.
import { today } from '../../lib/dates.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

// A-15: overdue is a confirmed invoice past its due date. It is worked out from
// the data, never stored, so it cannot go stale.
const overdueWhere = () => ({ status: 'CONFIRMED', dueDate: { lt: today() } });

const isOverdue = (invoice) => invoice.status === 'CONFIRMED' && invoice.dueDate < today();

// Each filter is its own condition and they are joined with AND, so
// `status=PAID&isOverdue=true` correctly returns nothing.
const buildListConditions = ({ status, isOverdue: overdueFilter, customerId, from, to, q }) => {
  const conditions = [];
  if (status) conditions.push({ status });
  if (overdueFilter === true) conditions.push(overdueWhere());
  if (overdueFilter === false) conditions.push({ NOT: overdueWhere() });
  if (customerId) conditions.push({ customerId });
  if (from) conditions.push({ issueDate: { gte: from } });
  if (to) conditions.push({ issueDate: { lte: to } });
  if (q) {
    conditions.push({
      OR: [
        { number: { contains: q, mode: 'insensitive' } },
        { billingName: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  return conditions;
};

const LIST_SELECT = {
  id: true,
  number: true,
  status: true,
  billingName: true,
  issueDate: true,
  dueDate: true,
  totalAmount: true,
  paidAmount: true,
  sentAt: true,
  subscription: { select: { id: true, number: true } },
};

const toListItem = (invoice) => ({
  ...invoice,
  balanceAmount: invoice.totalAmount - invoice.paidAmount,
  isOverdue: isOverdue(invoice),
});

export const listInvoices = async (query) => {
  const page = await paginate(
    prisma.invoice,
    {
      where: { AND: buildListConditions(query) },
      select: LIST_SELECT,
      orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
    },
    query,
  );
  return { ...page, items: page.items.map(toListItem) };
};
