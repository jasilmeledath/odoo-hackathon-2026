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

const rethrowVariantError = (error) => {
  if (error.code === 'P2002')
    throw new HttpError(409, 'This attribute and value already exist for this product', {
      value: 'This attribute and value already exist for this product',
    });
  if (error.code === 'P2003') throw new HttpError(404, 'Product not found');
  if (error.code === 'P2025') throw new HttpError(404, 'Variant not found');
  throw error;
};

export const saveVariant = async (productId, data, variantId) => {
  try {
    return variantId
      ? await prisma.productVariant.update({ where: { id: variantId, productId }, data })
      : await prisma.productVariant.create({ data: { ...data, productId } });
  } catch (error) {
    rethrowVariantError(error);
  }
};

export const removeVariant = (productId, variantId) =>
  prisma.$transaction(async (transaction) => {
    // PS-7: SET NULL foreign keys alone do not protect history. Lock the parent
    // against concurrent subscription references before checking and deleting.
    const locked = await transaction.$queryRaw`
    SELECT id FROM product_variants
    WHERE id = ${variantId} AND product_id = ${productId}
    FOR UPDATE
  `;
    if (!locked.length) throw new HttpError(404, 'Variant not found');
    const variant = await transaction.productVariant.findUnique({
      where: { id: variantId },
      select: { _count: { select: { subscriptionLines: true } } },
    });
    if (variant._count.subscriptionLines)
      throw new HttpError(409, 'This variant is used by a subscription and cannot be removed');
    await transaction.productVariant.delete({ where: { id: variantId } });
  });
