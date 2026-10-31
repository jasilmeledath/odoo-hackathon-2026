// Discount catalog reads derive eligibility states from IST dates and usage (PS-19).
import { today, toIsoDate } from '../../lib/dates.js';
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

const PRODUCTS = { products: { include: { product: { select: { id: true, name: true } } } } };

// PS-19, A-24: disabled rules take precedence, then expiry, exhaustion and future dates.
export const getDiscountState = (discount, on = today()) => {
  if (!discount.isActive) return 'INACTIVE';
  if (discount.endDate < on) return 'EXPIRED';
  if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) return 'USED_UP';
  if (discount.startDate > on) return 'SCHEDULED';
  return 'ACTIVE';
};

const serializeDiscount = (discount, on) => ({
  ...discount,
  percent: discount.percent === null ? null : Number(discount.percent),
  startDate: toIsoDate(discount.startDate),
  endDate: toIsoDate(discount.endDate),
  state: getDiscountState(discount, on),
  products: discount.products.map(({ product }) => product),
});

const stateWhere = (state, on) => {
  if (!state) return {};
  if (state === 'INACTIVE') return { isActive: false };
  if (state === 'EXPIRED') return { isActive: true, endDate: { lt: on } };
  const remaining = { OR: [{ usageLimit: null }, { usageCount: { lt: prisma.discount.fields.usageLimit } }] };
  const current = { isActive: true, endDate: { gte: on } };
  if (state === 'USED_UP')
    return { ...current, usageLimit: { not: null }, usageCount: { gte: prisma.discount.fields.usageLimit } };
  return { ...current, ...remaining, startDate: state === 'SCHEDULED' ? { gt: on } : { lte: on } };
};

export const listDiscounts = async ({ q, state, ...pagination }) => {
  const on = today();
  const result = await paginate(
    prisma.discount,
    {
      where: { AND: [q ? { name: { contains: q, mode: 'insensitive' } } : {}, stateWhere(state, on)] },
      orderBy: { id: 'asc' },
      include: PRODUCTS,
    },
    pagination,
  );
  return { ...result, items: result.items.map((discount) => serializeDiscount(discount, on)) };
};

export const getDiscount = async (id) => {
  const discount = await prisma.discount.findUnique({ where: { id }, include: PRODUCTS });
  if (!discount) throw new HttpError(404, 'Discount not found');
  return serializeDiscount(discount, today());
};
