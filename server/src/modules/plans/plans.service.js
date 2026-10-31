// Plan availability and detail queries for staff (PS-8, PS-9).
import { toIsoDate } from '../../lib/dates.js';
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

const serializePlan = (plan) => ({
  ...plan,
  startDate: toIsoDate(plan.startDate),
  endDate: plan.endDate ? toIsoDate(plan.endDate) : null,
});

export const listPlans = async ({ availableOn, isActive, q, ...pagination }) => {
  // PS-8: both sale boundaries are inclusive; an inactive plan cannot be sold.
  const availability = availableOn
    ? {
        isActive: true,
        startDate: { lte: availableOn },
        OR: [{ endDate: null }, { endDate: { gte: availableOn } }],
      }
    : {};
  const result = await paginate(
    prisma.plan,
    {
      where: {
        AND: [{ isActive, ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}) }, availability],
      },
      orderBy: { id: 'asc' },
    },
    pagination,
  );
  return { ...result, items: result.items.map(serializePlan) };
};

export const getPlan = async (id) => {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new HttpError(404, 'Plan not found');
  return serializePlan(plan);
};
