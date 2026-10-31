// Customer directory and database-side summaries (PS-12).
import { prisma } from '../../lib/prisma.js';
import { paginate } from '../../lib/pagination.js';
import { HttpError } from '../../lib/errors.js';
export function listCustomers(query) {
  const where = {
    ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    ...(query.q
      ? {
          OR: ['name', 'companyName', 'email'].map((field) => ({
            [field]: { contains: query.q, mode: 'insensitive' },
          })),
        }
      : {}),
  };
  return paginate(prisma.customer, { where, orderBy: { id: 'desc' } }, query);
}
export async function getCustomer(id) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new HttpError(404, 'Customer not found');
  const [subscriptions, invoices] = await Promise.all([
    prisma.subscription.groupBy({
      by: ['status'],
      where: { customerId: id },
      _count: { _all: true },
      _sum: { recurringAmount: true },
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: { customerId: id },
      _count: { _all: true },
      _sum: { totalAmount: true, paidAmount: true },
    }),
  ]);
  return { ...customer, subscriptions, invoices };
}
export async function saveCustomer(id, data) {
  if (id && !(await prisma.customer.findUnique({ where: { id }, select: { id: true } })))
    throw new HttpError(404, 'Customer not found');
  const conflict = () =>
    new HttpError(409, 'A customer with this email already exists', {
      email: 'A customer with this email already exists',
    });
  if (
    await prisma.customer.findFirst({
      where: { email: data.email, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    })
  )
    throw conflict();
  try {
    return id
      ? await prisma.customer.update({ where: { id }, data })
      : await prisma.customer.create({ data });
  } catch (error) {
    if (error.code === 'P2002') throw conflict();
    throw error;
  }
}
