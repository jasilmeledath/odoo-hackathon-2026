// Database-backed payment search; no account secrets are returned (PS-21).
import { prisma } from '../../lib/prisma.js';
import { paginate } from '../../lib/pagination.js';
export function listPayments(query) {
  const where = {
    ...(query.method ? { method: query.method } : {}),
    ...(query.from || query.to
      ? {
          paymentDate: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) },
        }
      : {}),
    ...(query.q
      ? {
          OR: [
            { invoice: { number: { contains: query.q, mode: 'insensitive' } } },
            { invoice: { billingName: { contains: query.q, mode: 'insensitive' } } },
            { note: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  return paginate(
    prisma.payment,
    {
      where,
      include: {
        invoice: { select: { id: true, number: true, billingName: true } },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ paymentDate: 'desc' }, { id: 'desc' }],
    },
    query,
  );
}
