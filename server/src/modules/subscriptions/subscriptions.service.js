// Subscription list, detail and activity queries (PS-12, PS-13, PS-14).
import { addDays, addPeriod, today, toDateOnly } from '../../lib/dates.js';
import { logActivity } from '../../lib/activity.js';
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import { nextBillingDateAfterPause } from './subscriptionLifecycle.js';

const NOT_FOUND_MESSAGE = 'Subscription not found';
const DEFAULT_QUOTATION_VALIDITY_DAYS = 30;

const TRANSITIONS = {
  QUOTE: { from: 'DRAFT', to: 'QUOTATION' },
  CONFIRM: { from: 'QUOTATION', to: 'CONFIRMED' },
  ACTIVATE: { from: 'CONFIRMED', to: 'ACTIVE' },
};

export const assertTransition = (currentStatus, action) => {
  const transition = TRANSITIONS[action];
  if (!transition || transition.from !== currentStatus) {
    const actionName = typeof action === 'string' ? action.toLowerCase() : 'change status for';
    throw new HttpError(409, `Cannot ${actionName} a subscription in ${currentStatus.toLowerCase()} status`);
  }
  return transition;
};

const buildListConditions = ({ status, customerId, planId, q }) => {
  const conditions = [];
  if (status) conditions.push({ status });
  if (customerId) conditions.push({ customerId });
  if (planId) conditions.push({ planId });
  if (q) {
    conditions.push({
      OR: [
        { number: { contains: q, mode: 'insensitive' } },
        {
          customer: {
            is: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { companyName: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
        { plan: { is: { name: { contains: q, mode: 'insensitive' } } } },
      ],
    });
  }
  return conditions;
};

const LIST_SELECT = {
  id: true,
  number: true,
  status: true,
  startDate: true,
  expiryDate: true,
  recurringAmount: true,
  customer: { select: { id: true, name: true, companyName: true } },
  plan: { select: { id: true, name: true, billingPeriod: true } },
};

export const listSubscriptions = async (query) =>
  paginate(
    prisma.subscription,
    {
      where: { AND: buildListConditions(query) },
      select: LIST_SELECT,
      orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
    },
    query,
  );

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
    select: {
      id: true,
      number: true,
      status: true,
      issueDate: true,
      dueDate: true,
      totalAmount: true,
      paidAmount: true,
    },
  },
};

export const getSubscription = async (id) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: DETAIL_INCLUDE,
  });
  if (!subscription) throw new HttpError(404, NOT_FOUND_MESSAGE);
  return subscription;
};

export const getSubscriptionActivity = async (subscriptionId) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true },
  });
  if (!subscription) throw new HttpError(404, NOT_FOUND_MESSAGE);

  return prisma.activityLog.findMany({
    where: { subscriptionId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 50,
    select: {
      id: true,
      action: true,
      detail: true,
      createdAt: true,
      actor: { select: { id: true, name: true, email: true } },
    },
  });
};

export const transitionSubscription = async (id, action, actor) => {
  await prisma.$transaction(async (tx) => {
    const businessDate = today();
    const subscription = await tx.subscription.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        status: true,
        startDate: true,
        quotationExpiryDate: true,
        template: { select: { validityDays: true } },
        lines: { select: { id: true } },
      },
    });
    if (!subscription) throw new HttpError(404, NOT_FOUND_MESSAGE);

    const transition = assertTransition(subscription.status, action);
    const data = { status: transition.to };
    if (action === 'QUOTE') {
      if (subscription.lines.length === 0) {
        throw new HttpError(409, 'Add at least one active line before sending a quotation');
      }
      const validityDays = subscription.template?.validityDays ?? DEFAULT_QUOTATION_VALIDITY_DAYS;
      data.quotationExpiryDate = addDays(businessDate, validityDays);
    }
    if (action === 'CONFIRM' && subscription.quotationExpiryDate) {
      if (toDateOnly(subscription.quotationExpiryDate) < businessDate) {
        throw new HttpError(409, 'This quotation has expired and cannot be confirmed');
      }
    }
    if (action === 'ACTIVATE') data.nextInvoiceDate = subscription.startDate;

    const { count } = await tx.subscription.updateMany({
      where: { id, status: subscription.status },
      data,
    });
    if (count !== 1) {
      throw new HttpError(
        409,
        'The subscription changed while this action was being processed. Refresh and try again',
      );
    }

    await logActivity(tx, {
      subscriptionId: id,
      action: 'STATUS_CHANGED',
      detail: `Subscription ${subscription.number} moved from ${subscription.status} to ${transition.to}`,
      actorId: actor.id,
    });
  });

  return getSubscription(id);
};

const assertPlanAllows = (plan, flag, action) => {
  if (!plan[flag]) throw new HttpError(409, `The plan does not allow subscriptions to ${action}`);
};

export const manageSubscription = async (id, action, actor, payload = {}) => {
  await prisma.$transaction(async (tx) => {
    const businessDate = today();
    const subscription = await tx.subscription.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        status: true,
        startDate: true,
        expiryDate: true,
        nextInvoiceDate: true,
        plan: {
          select: { canPause: true, canRenew: true, canCloseEarly: true, billingPeriod: true },
        },
      },
    });
    if (!subscription) throw new HttpError(404, NOT_FOUND_MESSAGE);

    let data;
    let activityAction;
    let detail;
    if (action === 'PAUSE') {
      assertPlanAllows(subscription.plan, 'canPause', 'pause');
      if (subscription.status !== 'ACTIVE')
        throw new HttpError(409, 'Only active subscriptions can be paused');
      data = { status: 'PAUSED' };
      activityAction = 'PAUSED';
      detail = `Subscription ${subscription.number} paused`;
    } else if (action === 'RESUME') {
      assertPlanAllows(subscription.plan, 'canPause', 'resume');
      if (subscription.status !== 'PAUSED')
        throw new HttpError(409, 'Only paused subscriptions can be resumed');
      const nextInvoiceDate = nextBillingDateAfterPause(
        subscription.nextInvoiceDate,
        subscription.startDate,
        subscription.plan.billingPeriod,
        businessDate,
      );
      data = { status: 'ACTIVE', nextInvoiceDate };
      activityAction = 'RESUMED';
      detail = `Subscription ${subscription.number} resumed${nextInvoiceDate ? `; next billing date ${toDateOnly(nextInvoiceDate).toISOString().slice(0, 10)}` : ''}`;
    } else if (action === 'RENEW') {
      assertPlanAllows(subscription.plan, 'canRenew', 'renew');
      if (subscription.status !== 'ACTIVE')
        throw new HttpError(409, 'Only active subscriptions can be renewed');
      if (payload.expiryDate <= subscription.expiryDate || payload.expiryDate <= businessDate) {
        throw new HttpError(400, 'Renewal expiry date must be after the current expiry date', {
          expiryDate: 'Choose a date after the current expiry date',
        });
      }
      let nextInvoiceDate = subscription.nextInvoiceDate;
      if (!nextInvoiceDate) {
        const latestInvoice = await tx.invoice.findFirst({
          where: { subscriptionId: id, status: { not: 'CANCELED' } },
          orderBy: [{ periodStartDate: 'desc' }, { id: 'desc' }],
          select: { periodStartDate: true },
        });
        nextInvoiceDate = latestInvoice
          ? addPeriod(
              latestInvoice.periodStartDate,
              subscription.plan.billingPeriod,
              subscription.startDate.getUTCDate(),
            )
          : subscription.startDate;
      }
      nextInvoiceDate = nextBillingDateAfterPause(
        nextInvoiceDate,
        subscription.startDate,
        subscription.plan.billingPeriod,
        businessDate,
      );
      data = {
        expiryDate: payload.expiryDate,
        nextInvoiceDate: nextInvoiceDate < payload.expiryDate ? nextInvoiceDate : null,
      };
      activityAction = 'RENEWED';
      detail = `Subscription ${subscription.number} renewed through ${toDateOnly(payload.expiryDate).toISOString().slice(0, 10)}`;
    } else if (action === 'CLOSE') {
      assertPlanAllows(subscription.plan, 'canCloseEarly', 'close early');
      if (!['ACTIVE', 'PAUSED'].includes(subscription.status)) {
        throw new HttpError(409, 'Only active or paused subscriptions can be closed early');
      }
      data = { status: 'CLOSED', closedAt: new Date(), closeReason: 'CLOSED_EARLY', nextInvoiceDate: null };
      activityAction = 'CLOSED';
      detail = `Subscription ${subscription.number} closed early`;
    } else {
      throw new HttpError(400, 'Choose a valid subscription action');
    }

    const { count } = await tx.subscription.updateMany({ where: { id, status: subscription.status }, data });
    if (count !== 1) {
      throw new HttpError(
        409,
        'The subscription changed while this action was being processed. Refresh and try again',
      );
    }
    await logActivity(tx, { subscriptionId: id, action: activityAction, detail, actorId: actor.id });
  });
  return getSubscription(id);
};
