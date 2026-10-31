// Writes one timeline entry (PS-13). Pass the transaction client when the entry
// belongs to a larger change. actorId stays null for scheduled work.
export const logActivity = (db, { subscriptionId, invoiceId, action, detail, actorId = null }) =>
  db.activityLog.create({ data: { subscriptionId, invoiceId, action, detail, actorId } });
