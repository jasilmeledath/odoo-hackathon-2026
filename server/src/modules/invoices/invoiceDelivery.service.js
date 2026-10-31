// PS-18: send invoice snapshots through the existing SMTP/offline mail helper.
import { toIsoDate } from '../../lib/dates.js';
import { HttpError } from '../../lib/errors.js';
import { logActivity } from '../../lib/activity.js';
import { sendMail } from '../../lib/mail.js';
import { prisma } from '../../lib/prisma.js';
import { getInvoice } from './invoices.service.js';

const formatAmount = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount / 100);
export const invoiceEmailText = (invoice) =>
  [
    `Invoice ${invoice.number} (${invoice.status})`,
    invoice.billingName,
    invoice.billingAddress ?? '',
    `Issued: ${toIsoDate(invoice.issueDate)} | Due: ${toIsoDate(invoice.dueDate)}`,
    `Period: ${toIsoDate(invoice.periodStartDate)} to ${toIsoDate(invoice.periodEndDate)}`,
    '',
    ...invoice.lines.map(
      (line) =>
        `${line.description}: ${line.quantity} × ${formatAmount(line.unitPrice)}; discount ${formatAmount(line.discountAmount)}; tax ${formatAmount(line.taxAmount)}`,
    ),
    '',
    `Subtotal: ${formatAmount(invoice.subtotalAmount)}`,
    `Discount: ${formatAmount(invoice.discountAmount)}`,
    `Tax: ${formatAmount(invoice.taxAmount)}`,
    `Total: ${formatAmount(invoice.totalAmount)}`,
    `Paid: ${formatAmount(invoice.paidAmount)}`,
    `Balance: ${formatAmount(invoice.balanceAmount)}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

export const sendInvoice = async (id, actor, { deliver = sendMail } = {}) => {
  const invoice = await getInvoice(id);
  const customer = await prisma.customer.findUnique({
    where: { id: invoice.customerId },
    select: { email: true },
  });
  try {
    await deliver({
      to: customer.email,
      subject: `Invoice ${invoice.number}`,
      text: invoiceEmailText(invoice),
    });
  } catch (error) {
    console.error(`Invoice ${id} email failed`, error);
    throw new HttpError(502, 'Invoice could not be sent. Check email settings and try again');
  }
  // SMTP and PostgreSQL cannot share a transaction; never mark failed delivery as sent.
  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id }, data: { sentAt: new Date() } });
    await logActivity(tx, {
      invoiceId: id,
      subscriptionId: invoice.subscriptionId,
      actorId: actor.id,
      action: 'SENT',
      detail: `Sent invoice ${invoice.number}`,
    });
  });
  return getInvoice(id);
};
