// PS-20: claim the best eligible rule atomically inside the invoice transaction.
import { prisma } from '../../lib/prisma.js';
import { calculateInvoice } from './billing.service.js';

export const findBillingDiscounts = async (db, lines, issueDate) => {
  const rules = await db.discount.findMany({
    where: {
      isActive: true,
      startDate: { lte: issueDate },
      endDate: { gte: issueDate },
      AND: [
        { OR: [{ usageLimit: null }, { usageCount: { lt: prisma.discount.fields.usageLimit } }] },
        {
          OR: [
            { scope: 'SUBSCRIPTION' },
            { products: { some: { productId: { in: lines.map((line) => line.productId) } } } },
          ],
        },
      ],
    },
    include: { products: { select: { productId: true } } },
  });
  return rules.map((rule) => ({ ...rule, productIds: rule.products.map((product) => product.productId) }));
};

export const calculateBillableInvoice = async (tx, lines, issueDate) => {
  let discounts = await findBillingDiscounts(tx, lines, issueDate);
  for (;;) {
    const calculated = calculateInvoice({ lines, discounts, issueDate });
    if (calculated.discountId === null) return calculated;
    const rule = discounts.find((discount) => discount.id === calculated.discountId);
    // Comparing the version as well as the count protects against concurrent edits.
    const { count } = await tx.discount.updateMany({
      where: {
        id: rule.id,
        isActive: true,
        updatedAt: rule.updatedAt,
        usageCount: { equals: rule.usageCount, lt: rule.usageLimit ?? 2_147_483_647 },
      },
      data: { usageCount: { increment: 1 } },
    });
    if (count === 1) return calculated;
    discounts = discounts.filter((discount) => discount.id !== rule.id);
  }
};
