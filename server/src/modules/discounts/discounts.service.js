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

export const saveDiscount = async (data, id) => {
  try {
    return await prisma.$transaction(async (tx) => {
      if (id) {
        // PS-19: serialize rule edits with billing claims; never overwrite usage.
        const rows = await tx.$queryRaw`SELECT usage_count AS "usageCount"
          FROM discounts WHERE id = ${id} FOR UPDATE`;
        if (!rows.length) throw new HttpError(404, 'Discount not found');
        if (data.usageLimit !== null && data.usageLimit < rows[0].usageCount)
          throw new HttpError(400, 'Validation failed', {
            usageLimit: 'Usage limit cannot be below the current usage count',
          });
      }
      const { productIds, ...values } = data;
      if (
        productIds.length &&
        (await tx.product.count({ where: { id: { in: productIds } } })) !== productIds.length
      )
        throw new HttpError(400, 'Validation failed', { productIds: 'Choose existing products' });
      const rule = {
        ...values,
        fixedAmount: values.type === 'FIXED' ? values.fixedAmount : null,
        percent: values.type === 'PERCENT' ? values.percent : null,
      };
      const products = { create: productIds.map((productId) => ({ productId })) };
      const discount = id
        ? await tx.discount.update({
            where: { id },
            data: { ...rule, products: { deleteMany: {}, ...products } },
            include: PRODUCTS,
          })
        : await tx.discount.create({ data: { ...rule, products }, include: PRODUCTS });
      return serializeDiscount(discount, today());
    });
  } catch (error) {
    if (error.code === 'P2002')
      throw new HttpError(409, 'Name is already in use', { name: 'Name is already in use' });
    if (error.code === 'P2025') throw new HttpError(404, 'Discount not found');
    if (error.code === 'P2003')
      throw new HttpError(409, 'Product choices changed. Reload and choose the products again');
    throw error;
  }
};
