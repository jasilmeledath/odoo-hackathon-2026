// PS-17: cancel unpaid invoices once, refund discount usage and restore the billing queue.
import { HttpError } from '../../lib/errors.js';
import { logActivity } from '../../lib/activity.js';
import { prisma } from '../../lib/prisma.js';
import { getInvoice } from './invoices.service.js';

export const cancelInvoice = async (id, actor) => {
  await prisma.$transaction(async (tx) => {
    const reference = await tx.invoice.findUnique({ where: { id }, select: { subscriptionId: true } });
    if (!reference) throw new HttpError(404, 'Invoice not found');
    // Match billing's subscription-first lock order. NO KEY UPDATE allows FK checks.
    await tx.$queryRaw`SELECT id FROM subscriptions WHERE id = ${reference.subscriptionId} FOR NO KEY UPDATE`;
    await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${id} FOR UPDATE`;
    const invoice = await tx.invoice.findUnique({
      where: { id },
      include: { payments: { select: { id: true }, take: 1 }, subscription: true },
    });
    if (
      !['DRAFT', 'CONFIRMED'].includes(invoice.status) ||
      invoice.paidAmount > 0 ||
      invoice.payments.length
    ) {
      throw new HttpError(409, 'Only an unpaid draft or confirmed invoice can be canceled');
    }
    await tx.invoice.update({ where: { id }, data: { status: 'CANCELED', canceledAt: new Date() } });
    if (invoice.discountId) {
      const returned = await tx.discount.updateMany({
        where: { id: invoice.discountId, usageCount: { gt: 0 } },
        data: { usageCount: { decrement: 1 } },
      });
      if (returned.count !== 1)
        throw new HttpError(409, 'Discount usage is inconsistent; reconcile it before canceling');
    }
    const cursor = invoice.subscription.nextInvoiceDate;
    if (!cursor || cursor > invoice.periodStartDate) {
      await tx.subscription.update({
        where: { id: invoice.subscriptionId },
        data: { nextInvoiceDate: invoice.periodStartDate },
      });
    }
    await logActivity(tx, {
      invoiceId: id,
      subscriptionId: invoice.subscriptionId,
      actorId: actor.id,
      action: 'CANCELED',
      detail: `Canceled invoice ${invoice.number}; period returned to billing`,
    });
  });
  return getInvoice(id);
};
