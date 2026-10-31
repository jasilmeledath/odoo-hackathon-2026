// Payment-term catalog reads for subscription forms (PS-12).
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
