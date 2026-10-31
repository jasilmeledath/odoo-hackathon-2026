// Every portal read is scoped to the authenticated customer (PS-26, PS-4).
import { prisma } from '../../lib/prisma.js';
import { paginate } from '../../lib/pagination.js';
import { HttpError } from '../../lib/errors.js';
import { withComputedFields } from '../invoices/invoices.service.js';
const SUBSCRIPTION_FIELDS = {
  id: true,
  number: true,
  status: true,
  startDate: true,
  expiryDate: true,
  recurringAmount: true,
  plan: { select: { name: true, billingPeriod: true, productId: true } },
};
const INVOICE_FIELDS = {
  id: true,
  number: true,
  status: true,
  billingName: true,
  issueDate: true,
  dueDate: true,
  totalAmount: true,
  paidAmount: true,
};
function assertCustomerProfile(customerId) {
  if (!Number.isInteger(customerId) || customerId <= 0)
    throw new HttpError(404, 'Customer profile not found');
}
function buildScope(customerId, { q, status }, searchFields) {
  assertCustomerProfile(customerId);
  return {
    customerId,
    ...(status ? { status } : {}),
    ...(q ? { OR: searchFields.map((field) => ({ [field]: { contains: q, mode: 'insensitive' } })) } : {}),
  };
}
export function listSubscriptions(customerId, query) {
  return paginate(
    prisma.subscription,
    {
      where: buildScope(customerId, query, ['number']),
      select: SUBSCRIPTION_FIELDS,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    },
    query,
  );
}
export async function getSubscription(customerId, id) {
  assertCustomerProfile(customerId);
  const subscription = await prisma.subscription.findFirst({
    where: { id, customerId },
    select: {
      ...SUBSCRIPTION_FIELDS,
      quotationExpiryDate: true,
      notes: true,
      lines: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          amount: true,
          isActive: true,
          product: { select: { id: true, name: true } },
          variant: { select: { attribute: true, value: true } },
          tax: { select: { name: true, ratePercent: true } },
        },
      },
    },
  });
  if (!subscription) throw new HttpError(404, 'Subscription not found');
  return subscription;
}
export async function listInvoices(customerId, query) {
  const page = await paginate(
    prisma.invoice,
    {
      where: buildScope(customerId, query, ['number', 'billingName']),
      select: INVOICE_FIELDS,
      orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
    },
    query,
  );
  return { ...page, items: page.items.map(withComputedFields) };
}
export async function getInvoice(customerId, id) {
  assertCustomerProfile(customerId);
  const invoice = await prisma.invoice.findFirst({
    where: { id, customerId },
    select: {
      ...INVOICE_FIELDS,
      billingAddress: true,
      periodStartDate: true,
      periodEndDate: true,
      subtotalAmount: true,
      discountAmount: true,
      taxAmount: true,
      subscription: { select: { id: true, number: true } },
      discount: { select: { name: true } },
      lines: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPrice: true,
          amount: true,
          discountAmount: true,
          taxName: true,
          taxRatePercent: true,
          taxAmount: true,
        },
      },
      payments: {
        orderBy: [{ paymentDate: 'desc' }, { id: 'desc' }],
        select: { id: true, method: true, amount: true, paymentDate: true, note: true },
      },
    },
  });
  if (!invoice) throw new HttpError(404, 'Invoice not found');
  return withComputedFields(invoice);
}
