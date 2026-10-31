// Finance summary and filtered reports (PS-23, PS-24).
import { Router } from 'express';
import { subscribeToDashboardChanges } from '../../lib/dashboardEvents.js';
import { STAFF_ROLES } from '../../lib/constants.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getMonthlyRevenue } from './revenue.service.js';
import { revenueQuerySchema } from './revenue.schemas.js';
import { listRenewals, getFinanceSummary } from './reports.service.js';
import { renewalsQuerySchema, summaryQuerySchema } from './reports.schemas.js';

const router = Router();

router.use(requireAuth, requireRole(...STAFF_ROLES));

router.get('/events', (_req, res) => {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('event: connected\ndata: {}\n\n');

  let isClosed = false;
  const sendChanged = () => {
    if (!isClosed && !res.destroyed) res.write('event: changed\ndata: {}\n\n');
  };
  const unsubscribe = subscribeToDashboardChanges(sendChanged);
  const heartbeat = setInterval(() => {
    if (!isClosed && !res.destroyed) res.write(': keep-alive\n\n');
  }, 25_000);

  const closeStream = () => {
    if (isClosed) return;
    isClosed = true;
    clearInterval(heartbeat);
    unsubscribe();
  };
  res.on('close', closeStream);
});

router.get('/revenue', validate(revenueQuerySchema, 'query'), async (req, res) => {
  res.json(await getMonthlyRevenue(req.validQuery));
});

router.get('/summary', validate(summaryQuerySchema, 'query'), async (req, res) => {
  res.json(await getFinanceSummary(req.validQuery));
});

router.get('/renewals', validate(renewalsQuerySchema, 'query'), async (req, res) => {
  res.json(await listRenewals(req.validQuery));
});

export default router;
