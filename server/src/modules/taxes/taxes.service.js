// Tax catalog reads for staff selection controls (PS-10).
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
