// Subscription detail and activity queries (PS-12, PS-13).
import { HttpError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

const NOT_FOUND_MESSAGE = 'Subscription not found';

const DETAIL_INCLUDE = {
  customer: { select: { id: true, name: true, companyName: true, email: true, phone: true, address: true } },
  plan: {
    select: {
      id: true,
      name: true,
      billingPeriod: true,
      minQuantity: true,
      closesAtExpiry: true,
      canCloseEarly: true,
      canPause: true,
      canRenew: true,
    },
  },
  paymentTerm: { select: { id: true, name: true, dueDays: true } },
  lines: {
    orderBy: { id: 'asc' },
    include: {
      product: { select: { id: true, name: true } },
      variant: { select: { id: true, attribute: true, value: true, extraPrice: true } },
      tax: { select: { id: true, name: true, ratePercent: true } },
    },
  },
  invoices: {
    orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
    select: { id: true, number: true, status: true, issueDate: true, dueDate: true, totalAmount: true, paidAmount: true },
  },
};

export const getSubscription = async (id) => {
  const subscription = await prisma.subscription.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!subscription) throw new HttpError(404, NOT_FOUND_MESSAGE);
  return subscription;
};

export const getSubscriptionActivity = async (id) => {
  const subscriptionExists = await prisma.subscription.findUnique({ where: { id }, select: { id: true } });
  if (!subscriptionExists) throw new HttpError(404, NOT_FOUND_MESSAGE);

  return prisma.activityLog.findMany({
    where: { subscriptionId: id },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      action: true,
      detail: true,
      createdAt: true,
      actor: { select: { id: true, name: true } },
    },
  });
};
