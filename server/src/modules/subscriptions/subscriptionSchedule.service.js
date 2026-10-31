// PS-14: scheduled transitions are conditional and audited, even across app instances.
import { prisma } from '../../lib/prisma.js';
import { logActivity } from '../../lib/activity.js';
const SCHEDULE_BATCH_SIZE = 100;

const transitionDue = async (where, dataFor, description) => {
  let lastId = 0;
  const result = { changed: 0, failed: 0 };
  for (;;) {
    const batch = await prisma.subscription.findMany({
      where: { ...where, id: { gt: lastId } },
      select: { id: true, number: true, startDate: true },
      orderBy: { id: 'asc' },
      take: SCHEDULE_BATCH_SIZE,
    });
    if (!batch.length) return result;
    for (const subscription of batch) {
      try {
        const changed = await prisma.$transaction(async (tx) => {
          const update = await tx.subscription.updateMany({
            where: { ...where, id: subscription.id },
            data: dataFor(subscription),
          });
          if (update.count)
            await logActivity(tx, {
              subscriptionId: subscription.id,
              action: 'STATUS_CHANGED',
              detail: `${subscription.number}: ${description}`,
            });
          return update.count;
        });
        result.changed += changed;
      } catch (error) {
        result.failed += 1;
        console.error(`Scheduled transition failed for subscription ${subscription.id}`, error);
      }
    }
    lastId = batch.at(-1).id;
  }
};

export const activateDueSubscriptions = (issueDate) =>
  transitionDue(
    { status: 'CONFIRMED', startDate: { lte: issueDate } },
    (subscription) => ({ status: 'ACTIVE', nextInvoiceDate: subscription.startDate }),
    'activated on start date',
  );
export const closeExpiredSubscriptions = (issueDate) =>
  transitionDue(
    { status: 'ACTIVE', expiryDate: { lte: issueDate }, plan: { is: { closesAtExpiry: true } } },
    () => ({ status: 'CLOSED', closedAt: new Date(), closeReason: 'EXPIRED', nextInvoiceDate: null }),
    'closed at expiry',
  );
