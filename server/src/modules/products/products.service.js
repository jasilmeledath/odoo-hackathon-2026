// Product catalog queries with the related variant and plan options (PS-6, PS-7).
import { toIsoDate } from '../../lib/dates.js';
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

export const listProducts = ({ type, isActive, q, ...pagination }) =>
  paginate(
    prisma.product,
    {
      where: { type, isActive, ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}) },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        salesPrice: true,
        costPrice: true,
        taxId: true,
        notes: true,
        isActive: true,
      },
    },
    pagination,
  );

export const getProduct = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { id: 'asc' } }, plans: { orderBy: { id: 'asc' } } },
  });
  if (!product) throw new HttpError(404, 'Product not found');
  return {
    ...product,
    plans: product.plans.map((plan) => ({
      ...plan,
      startDate: toIsoDate(plan.startDate),
      endDate: plan.endDate ? toIsoDate(plan.endDate) : null,
    })),
  };
};

export const saveProduct = async (data, id) => {
  try {
    return await (id ? prisma.product.update({ where: { id }, data }) : prisma.product.create({ data }));
  } catch (error) {
    if (error.code === 'P2002')
      throw new HttpError(409, 'Name is already in use', { name: 'Name is already in use' });
    throw error;
  }
};
