// Customer-only portal HTTP; tenant identity never comes from caller input (PS-26, PS-27).
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../lib/validation.js';
import {
  portalSubscriptionQuerySchema,
  portalInvoiceQuerySchema,
  portalActionSchema,
  portalAddonSchema,
  portalAddonParamsSchema,
} from './portal.schemas.js';
import {
  listSubscriptions,
  getSubscription,
  listInvoices,
  getInvoice,
  manageOwnSubscription,
  acceptQuotation,
} from './portal.service.js';
import { updateAddon } from './portalAddons.service.js';
const router = Router();
router.use(requireAuth, requireRole('CUSTOMER'));
router.get('/subscriptions', validate(portalSubscriptionQuerySchema, 'query'), async (req, res) =>
  res.json(await listSubscriptions(req.user.customerId, req.validQuery)),
);
router.get('/subscriptions/:id', validate(idParamSchema, 'params'), async (req, res) =>
  res.json(await getSubscription(req.user.customerId, req.validParams.id)),
);
for (const action of ['pause', 'resume', 'close']) {
  router.post(
    '/subscriptions/:id/' + action,
    validate(idParamSchema, 'params'),
    validate(portalActionSchema),
    async (req, res) =>
      res.json(await manageOwnSubscription(req.validParams.id, action.toUpperCase(), req.user)),
  );
}
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
router.post(
  '/subscriptions/:id/accept',
  validate(idParamSchema, 'params'),
  validate(portalActionSchema),
  async (req, res) => res.json(await acceptQuotation(req.validParams.id, req.user)),
);
export default router;
