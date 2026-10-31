// Portal orchestration delegates line rules to the subscriptions domain (PS-27).
import { setSubscriptionLineActive } from '../subscriptions/subscriptionAddons.service.js';
import { getSubscription } from './portal.service.js';
export async function updateAddon(params, isActive, actor) {
  await setSubscriptionLineActive(params.id, params.lineId, isActive, actor);
  return getSubscription(actor.customerId, params.id);
}
