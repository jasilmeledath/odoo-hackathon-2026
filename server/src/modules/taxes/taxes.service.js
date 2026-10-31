// Tax catalog reads and writes for staff selection controls (PS-10).
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

export const listTaxes = (query) =>
  paginate(
    prisma.tax,
    {
      where: query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {},
      orderBy: { id: 'asc' },
      select: { id: true, name: true, ratePercent: true, isActive: true },
    },
    query,
  );

export const saveTax = async (data, id) => {
  try {
    return await (id ? prisma.tax.update({ where: { id }, data }) : prisma.tax.create({ data }));
  } catch (error) {
    if (error.code === 'P2002')
      throw new HttpError(409, 'Name is already in use', { name: 'Name is already in use' });
    throw error;
  }
};
