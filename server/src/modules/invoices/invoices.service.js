// Invoice rules and queries (PS-17, PS-22). Routes call these functions and
// hold no rules of their own.
import { logActivity } from '../../lib/activity.js';
import { today } from '../../lib/dates.js';
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

const NOT_FOUND_MESSAGE = 'Invoice not found';

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

const withComputedFields = (invoice) => ({
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
  return { ...page, items: page.items.map(withComputedFields) };
};

const DETAIL_INCLUDE = {
  lines: { orderBy: { id: 'asc' } },
  payments: {
    orderBy: [{ paymentDate: 'desc' }, { id: 'desc' }],
    include: { recordedBy: { select: { id: true, name: true } } },
  },
  subscription: { select: { id: true, number: true } },
  discount: { select: { id: true, name: true } },
};

export const getInvoice = async (id) => {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!invoice) throw new HttpError(404, NOT_FOUND_MESSAGE);
  return withComputedFields(invoice);
};

// PS-17: only a draft can be confirmed. The status is checked inside the update,
// so two people confirming at once cannot both succeed.
export const confirmInvoice = async (id, actor) => {
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.invoice.updateMany({
      where: { id, status: 'DRAFT' },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });
    const invoice = await tx.invoice.findUnique({
      where: { id },
      select: { number: true, status: true, subscriptionId: true },
    });
    if (!invoice) throw new HttpError(404, NOT_FOUND_MESSAGE);
    if (count === 0) {
      throw new HttpError(
        409,
        `Only a draft invoice can be confirmed. This invoice is ${invoice.status.toLowerCase()}.`,
      );
    }
    await logActivity(tx, {
      invoiceId: id,
      subscriptionId: invoice.subscriptionId,
      action: 'STATUS_CHANGED',
      detail: `Invoice ${invoice.number} confirmed`,
      actorId: actor.id,
    });
  });
  return getInvoice(id);
};
