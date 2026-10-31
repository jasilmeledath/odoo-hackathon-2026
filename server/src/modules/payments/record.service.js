// Payment and invoice balance change atomically under a row lock (PS-21, PS-22).
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/errors.js';
import { logActivity } from '../../lib/activity.js';
const PAISE_PER_RUPEE = 100;
const formatBalance = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount / PAISE_PER_RUPEE);
export function recordPayment({ invoiceId, amount, method, paymentDate, note }, actorId) {
  return prisma.$transaction(async (transaction) => {
    // Concurrent requests must see the previous committed payment before checking balance.
    await transaction.$queryRaw`SELECT id FROM invoices WHERE id = ${invoiceId} FOR UPDATE`;
    const invoice = await transaction.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new HttpError(404, 'Invoice not found');
    if (invoice.status !== 'CONFIRMED') throw new HttpError(409, 'Only a confirmed invoice accepts payments');
    const balance = invoice.totalAmount - invoice.paidAmount;
    if (amount > balance) {
      const message = 'Amount cannot exceed the balance of ' + formatBalance(balance);
      throw new HttpError(400, message, { amount: message });
    }
    const paidAmount = invoice.paidAmount + amount;
    const updated = await transaction.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount,
        ...(paidAmount === invoice.totalAmount ? { status: 'PAID', paidAt: new Date() } : {}),
      },
    });
    const payment = await transaction.payment.create({
      data: { invoiceId, amount, method, paymentDate, note, recordedById: actorId },
    });
    await logActivity(transaction, {
      invoiceId,
      subscriptionId: invoice.subscriptionId,
      actorId,
      action: 'PAYMENT_RECORDED',
      detail: 'Recorded payment ' + payment.id,
    });
    return { payment, invoice: { ...updated, balanceAmount: updated.totalAmount - updated.paidAmount } };
  });
}
