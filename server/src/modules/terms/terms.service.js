// Payment-term catalog reads and writes for subscription forms (PS-12).
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

export const listPaymentTerms = (query) =>
  paginate(
    prisma.paymentTerm,
    {
      where: query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {},
      orderBy: { id: 'asc' },
      select: { id: true, name: true, dueDays: true, isActive: true },
    },
    query,
  );

export const savePaymentTerm = async (data, id) => {
  try {
    return await (id
      ? prisma.paymentTerm.update({ where: { id }, data })
      : prisma.paymentTerm.create({ data }));
  } catch (error) {
    if (error.code === 'P2002')
      throw new HttpError(409, 'Name is already in use', { name: 'Name is already in use' });
    throw error;
  }
};
