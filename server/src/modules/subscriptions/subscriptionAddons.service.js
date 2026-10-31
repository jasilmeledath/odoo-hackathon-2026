// Serialize customer-owned add-on changes with their totals and activity (PS-27).
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/errors.js';
import { logActivity } from '../../lib/activity.js';
import { calculateSubscriptionAmounts } from './subscriptionAmounts.js';
export async function setSubscriptionLineActive(id, lineId, isActive, actor) {
  if (!Number.isInteger(actor.customerId) || actor.customerId <= 0)
    throw new HttpError(404, 'Subscription not found');
  await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM subscriptions WHERE id = ${id} AND customer_id = ${actor.customerId} FOR UPDATE`;
    const subscription = await transaction.subscription.findFirst({
      where: { id, customerId: actor.customerId },
      select: {
        id: true,
        status: true,
        plan: { select: { productId: true, billingPeriod: true } },
        lines: { select: { id: true, productId: true, amount: true, isActive: true } },
      },
    });
    if (!subscription) throw new HttpError(404, 'Subscription not found');
    const line = subscription.lines.find((candidate) => candidate.id === lineId);
    if (!line) throw new HttpError(404, 'Subscription line not found');
    if (subscription.status === 'CLOSED') throw new HttpError(409, 'Closed subscriptions cannot be changed');
    if (line.productId === subscription.plan.productId && !isActive)
      throw new HttpError(400, 'The plan product must remain active', {
        isActive: 'The plan product must remain active',
      });
    if (line.isActive === isActive) return;
    const amounts = calculateSubscriptionAmounts(
      subscription.lines.map((candidate) =>
        candidate.id === lineId ? { ...candidate, isActive } : candidate,
      ),
      subscription.plan.billingPeriod,
    );
    await transaction.subscriptionLine.update({
      where: { id: lineId, subscriptionId: id },
      data: { isActive },
    });
    await transaction.subscription.update({ where: { id, customerId: actor.customerId }, data: amounts });
    await logActivity(transaction, {
      subscriptionId: id,
      actorId: actor.id,
      action: 'UPDATED',
      detail: 'Add-on line ' + lineId + (isActive ? ' enabled' : ' disabled'),
    });
  });
}
