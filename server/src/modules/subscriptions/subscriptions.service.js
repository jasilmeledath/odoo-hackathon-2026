// Subscription list, detail and activity queries (PS-12, PS-13, PS-14).
import { addDays, addPeriod, today, toDateOnly } from '../../lib/dates.js';
import { logActivity } from '../../lib/activity.js';
import { HttpError } from '../../lib/errors.js';
import { paginate } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import { nextBillingDateAfterPause } from './subscriptionLifecycle.js';
import { nextNumber } from '../../lib/numbering.js';
import { toMonthlyAmount } from '../../lib/money.js';

const NOT_FOUND_MESSAGE = 'Subscription not found';
const DEFAULT_QUOTATION_VALIDITY_DAYS = 30;
const MAX_DATABASE_INTEGER = 2_147_483_647;

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

const prepareSubscriptionLines = async (tx, lines, plan, startDate) => {
  if (
    toDateOnly(startDate) < toDateOnly(plan.startDate) ||
    (plan.endDate && toDateOnly(startDate) > toDateOnly(plan.endDate))
  ) {
    throw new HttpError(400, 'The selected plan is not available on the start date', {
      planId: 'Choose a plan available on the start date',
    });
  }

  const productIds = [...new Set(lines.map(({ productId }) => productId))];
  const products = await tx.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, salesPrice: true, taxId: true },
  });
  const productById = new Map(products.map((product) => [product.id, product]));
  if (productById.size !== productIds.length) {
    throw new HttpError(400, 'Choose active products for every line', {
      lines: 'A selected product is unavailable',
    });
  }

  const variantIds = [...new Set(lines.map(({ variantId }) => variantId).filter(Boolean))];
  const variants = variantIds.length
    ? await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, productId: true, extraPrice: true },
      })
    : [];
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));
  const taxIds = [
    ...new Set(
      lines.map(({ taxId, productId }) => taxId ?? productById.get(productId).taxId).filter(Boolean),
    ),
  ];
  const activeTaxIds = taxIds.length
    ? new Set(
        (await tx.tax.findMany({ where: { id: { in: taxIds }, isActive: true }, select: { id: true } })).map(
          ({ id }) => id,
        ),
      )
    : new Set();

  let planProductQuantity = 0;
  const preparedLines = [];
  for (const line of lines) {
    const product = productById.get(line.productId);
    let variantExtraPrice = 0;
    if (line.variantId) {
      const variant = variantById.get(line.variantId);
      if (!variant || variant.productId !== product.id) {
        throw new HttpError(400, 'Choose a variant that belongs to the selected product', {
          lines: 'Invalid product variant',
        });
      }
      variantExtraPrice = variant.extraPrice;
    }
    const taxId = line.taxId ?? product.taxId;
    if (taxId && !activeTaxIds.has(taxId)) {
      throw new HttpError(400, 'Choose an active tax rule', { lines: 'A selected tax rule is unavailable' });
    }
    const basePrice = product.id === plan.productId ? plan.price : product.salesPrice;
    const unitPrice = basePrice + variantExtraPrice;
    const amount = unitPrice * line.quantity;
    if (!Number.isSafeInteger(amount) || amount > MAX_DATABASE_INTEGER) {
      throw new HttpError(400, 'A subscription line total is too large', {
        lines: 'Reduce the quantity or choose a lower-priced product',
      });
    }
    if (product.id === plan.productId) planProductQuantity += line.quantity;
    preparedLines.push({ ...line, taxId: taxId ?? null, unitPrice, amount });
  }
  if (planProductQuantity < plan.minQuantity) {
    throw new HttpError(400, `The plan requires at least ${plan.minQuantity} of its product`, {
      lines: `Add at least ${plan.minQuantity} of the plan product`,
    });
  }

  const recurringAmount = preparedLines.reduce((total, line) => total + line.amount, 0);
  const monthlyRecurringAmount = toMonthlyAmount(recurringAmount, plan.billingPeriod);
  if (recurringAmount > MAX_DATABASE_INTEGER || monthlyRecurringAmount > MAX_DATABASE_INTEGER) {
    throw new HttpError(400, 'The subscription total is too large', {
      lines: 'Reduce line quantities or prices',
    });
  }
  return { lines: preparedLines, recurringAmount, monthlyRecurringAmount };
};

const loadActiveReferences = async (tx, data) => {
  const [customer, plan, paymentTerm] = await Promise.all([
    tx.customer.findFirst({ where: { id: data.customerId, isActive: true }, select: { id: true } }),
    tx.plan.findFirst({
      where: { id: data.planId, isActive: true },
      select: {
        id: true,
        productId: true,
        price: true,
        minQuantity: true,
        billingPeriod: true,
        startDate: true,
        endDate: true,
      },
    }),
    tx.paymentTerm.findFirst({ where: { id: data.paymentTermId, isActive: true }, select: { id: true } }),
  ]);
  if (!customer)
    throw new HttpError(400, 'Choose an active customer', { customerId: 'Choose an active customer' });
  if (!plan) throw new HttpError(400, 'Choose an active plan', { planId: 'Choose an active plan' });
  if (!paymentTerm)
    throw new HttpError(400, 'Choose an active payment term', {
      paymentTermId: 'Choose an active payment term',
    });
  return plan;
};

export const createSubscription = async (data, actor) => {
  const id = await prisma.$transaction(async (tx) => {
    const plan = await loadActiveReferences(tx, data);
    const priced = await prepareSubscriptionLines(tx, data.lines, plan, data.startDate);
    const number = await nextNumber(tx, 'SUBSCRIPTION');
    const subscription = await tx.subscription.create({
      data: {
        number,
        customerId: data.customerId,
        planId: data.planId,
        paymentTermId: data.paymentTermId,
        startDate: data.startDate,
        expiryDate: data.expiryDate,
        notes: data.notes || null,
        recurringAmount: priced.recurringAmount,
        monthlyRecurringAmount: priced.monthlyRecurringAmount,
        lines: { create: priced.lines },
      },
      select: { id: true, number: true },
    });
    await logActivity(tx, {
      subscriptionId: subscription.id,
      action: 'CREATED',
      detail: `Draft subscription ${subscription.number} created`,
      actorId: actor.id,
    });
    return subscription.id;
  });
  return getSubscription(id);
};

export const updateSubscription = async (id, data, actor) => {
  await prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findUnique({
      where: { id },
      select: { id: true, number: true, status: true },
    });
    if (!current) throw new HttpError(404, NOT_FOUND_MESSAGE);
    if (!['DRAFT', 'QUOTATION'].includes(current.status)) {
      throw new HttpError(409, `Cannot edit a subscription in ${current.status.toLowerCase()} status`);
    }
    const plan = await loadActiveReferences(tx, data);
    const priced = await prepareSubscriptionLines(tx, data.lines, plan, data.startDate);
    const { count } = await tx.subscription.updateMany({
      where: { id, status: { in: ['DRAFT', 'QUOTATION'] } },
      data: {
        customerId: data.customerId,
        planId: data.planId,
        paymentTermId: data.paymentTermId,
        startDate: data.startDate,
        expiryDate: data.expiryDate,
        notes: data.notes || null,
        recurringAmount: priced.recurringAmount,
        monthlyRecurringAmount: priced.monthlyRecurringAmount,
      },
    });
    if (count !== 1)
      throw new HttpError(409, 'The subscription changed while editing. Refresh and try again');
    await tx.subscriptionLine.deleteMany({ where: { subscriptionId: id } });
    await tx.subscriptionLine.createMany({
      data: priced.lines.map((line) => ({ ...line, subscriptionId: id })),
    });
    await logActivity(tx, {
      subscriptionId: id,
      action: 'UPDATED',
      detail: `Subscription ${current.number} updated`,
      actorId: actor.id,
    });
  });
  return getSubscription(id);
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
