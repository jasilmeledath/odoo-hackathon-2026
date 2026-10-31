// Customer-only reads and add-on actions use authenticated tenant identity (PS-26, PS-27).
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../lib/validation.js';
import { portalSubscriptionQuerySchema, portalInvoiceQuerySchema } from './portal.schemas.js';
import { listSubscriptions, getSubscription, listInvoices, getInvoice } from './portal.service.js';
import { portalAddonSchema, portalAddonParamsSchema } from './portal.schemas.js';
import { updateAddon } from './portalAddons.service.js';
const router = Router();
router.use(requireAuth, requireRole('CUSTOMER'));
router.get('/subscriptions', validate(portalSubscriptionQuerySchema, 'query'), async (req, res) =>
  res.json(await listSubscriptions(req.user.customerId, req.validQuery)),
);
router.get('/subscriptions/:id', validate(idParamSchema, 'params'), async (req, res) =>
  res.json(await getSubscription(req.user.customerId, req.validParams.id)),
);
router.get('/invoices', validate(portalInvoiceQuerySchema, 'query'), async (req, res) =>
  res.json(await listInvoices(req.user.customerId, req.validQuery)),
);
router.get('/invoices/:id', validate(idParamSchema, 'params'), async (req, res) =>
  res.json(await getInvoice(req.user.customerId, req.validParams.id)),
);
router.patch(
  '/subscriptions/:id/lines/:lineId',
  validate(portalAddonParamsSchema, 'params'),
  validate(portalAddonSchema),
  async (req, res) => res.json(await updateAddon(req.validParams, req.body.isActive, req.user)),
);
export default router;
