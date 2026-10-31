// Templates retain choices; current catalog prices are calculated only on reads (PS-11).
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';

const PLAN = { select: { id: true, name: true, productId: true, price: true } };
const DETAIL = {
  plan: PLAN,
  lines: {
    orderBy: { id: 'asc' },
    include: {
      product: { select: { id: true, name: true, salesPrice: true } },
      variant: { select: { id: true, attribute: true, value: true, extraPrice: true } },
    },
  },
};

const serializeTemplate = (template) => ({
  ...template,
  // PS-11, A-5: the plan replaces its own product's sales price.
  lines: template.lines.map((line) => ({
    ...line,
    unitPrice:
      (line.productId === template.plan.productId ? template.plan.price : line.product.salesPrice) +
      (line.variant?.extraPrice ?? 0),
  })),
});

export const listTemplates = ({ q, ...pagination }) =>
  paginate(
    prisma.quotationTemplate,
    {
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      orderBy: { id: 'asc' },
      include: { plan: PLAN, _count: { select: { lines: true } } },
    },
    pagination,
  );

export const getTemplate = async (id) => {
  const template = await prisma.quotationTemplate.findUnique({ where: { id }, include: DETAIL });
  if (!template) throw new HttpError(404, 'Template not found');
  return serializeTemplate(template);
};

const validateReferences = async (tx, data) => {
  const [plan, products, variants] = await Promise.all([
    tx.plan.findUnique({ where: { id: data.planId }, select: { id: true } }),
    tx.product.findMany({
      where: { id: { in: data.lines.map((line) => line.productId) } },
      select: { id: true },
    }),
    tx.productVariant.findMany({
      where: { id: { in: data.lines.flatMap((line) => (line.variantId ? [line.variantId] : [])) } },
      select: { id: true, productId: true },
    }),
  ]);
  const fields = {};
  if (!plan) fields.planId = 'Choose an existing plan';
  const productIds = new Set(products.map((product) => product.id));
  const variantProducts = new Map(variants.map((variant) => [variant.id, variant.productId]));
  data.lines.forEach((line, index) => {
    if (!productIds.has(line.productId))
      fields['lines.' + index + '.productId'] = 'Choose an existing product';
    if (line.variantId && variantProducts.get(line.variantId) !== line.productId)
      fields['lines.' + index + '.variantId'] = 'Choose a variant of this product';
  });
  if (Object.keys(fields).length) throw new HttpError(400, 'Validation failed', fields);
};

export const saveTemplate = async (data, id) => {
  try {
    return await prisma.$transaction(async (tx) => {
      await validateReferences(tx, data);
      const { lines, ...values } = data;
      const template = id
        ? await tx.quotationTemplate.update({
            where: { id },
            data: {
              ...values,
              lines: { deleteMany: {}, create: lines },
            },
            include: DETAIL,
          })
        : await tx.quotationTemplate.create({
            data: { ...values, lines: { create: lines } },
            include: DETAIL,
          });
      return serializeTemplate(template);
    });
  } catch (error) {
    if (error.code === 'P2002')
      throw new HttpError(409, 'Name is already in use', { name: 'Name is already in use' });
    if (error.code === 'P2025') throw new HttpError(404, 'Template not found');
    if (error.code === 'P2003')
      throw new HttpError(409, 'Catalog choices changed. Reload and choose the plan and products again');
    throw error;
  }
};
