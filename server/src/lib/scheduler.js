// PS-14/PS-15: activate, close expired plans, then bill at startup and hourly.
import { today } from './dates.js';
import {
  activateDueSubscriptions,
  closeExpiredSubscriptions,
} from '../modules/subscriptions/subscriptionSchedule.service.js';
import { runBilling } from '../modules/billing/billingRun.service.js';
const SCHEDULE_INTERVAL_MS = 60 * 60 * 1000;
let timer = null;
let inFlight = null;

export const runScheduledTasks = async ({ issueDate = today(), bill = runBilling } = {}) => {
  const result = { activated: 0, closed: 0, failed: 0, billing: null };
  for (const [name, phase] of [
    ['activated', activateDueSubscriptions],
    ['closed', closeExpiredSubscriptions],
  ]) {
    try {
      const outcome = await phase(issueDate);
      result[name] = outcome.changed;
      result.failed += outcome.failed;
    } catch (error) {
      result.failed += 1;
      console.error(`Scheduler ${name} phase failed`, error);
    }
  }
  try {
    result.billing = await bill({ issueDate });
    result.failed += result.billing.failed;
  } catch (error) {
    result.failed += 1;
    console.error('Scheduler billing phase failed', error);
  }
  return result;
};

export const startScheduler = () => {
  if (timer) return;
  const tick = () => {
    if (inFlight) return;
    inFlight = runScheduledTasks()
      .catch((error) => console.error('Scheduler failed', error))
      .finally(() => {
        inFlight = null;
      });
  };
  timer = setInterval(tick, SCHEDULE_INTERVAL_MS);
  timer.unref();
  tick();
};
export const stopScheduler = async () => {
  clearInterval(timer);
  timer = null;
  if (inFlight) await inFlight;
};
