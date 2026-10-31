// Plan availability and detail queries for staff (PS-8, PS-9).
import { toIsoDate } from '../../lib/dates.js';
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

const PRODUCT_RELATION = { product: { select: { id: true, name: true } } };

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
      include: PRODUCT_RELATION,
    },
    pagination,
  );
  return { ...result, items: result.items.map(serializePlan) };
};

export const getPlan = async (id) => {
  const plan = await prisma.plan.findUnique({ where: { id }, include: PRODUCT_RELATION });
  if (!plan) throw new HttpError(404, 'Plan not found');
  return serializePlan(plan);
};

export const savePlan = async (data, id) => {
  try {
    const plan = id
      ? await prisma.plan.update({ where: { id }, data, include: PRODUCT_RELATION })
      : await prisma.plan.create({ data, include: PRODUCT_RELATION });
    return serializePlan(plan);
  } catch (error) {
    if (error.code === 'P2002')
      throw new HttpError(409, 'Name is already in use', { name: 'Name is already in use' });
    if (error.code === 'P2003')
      throw new HttpError(400, 'Validation failed', { productId: 'Choose an existing product' });
    throw error;
  }
};
