// Customer-only HTTP reads; tenant identity never comes from query or body (PS-26).
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../lib/validation.js';
import { portalSubscriptionQuerySchema, portalInvoiceQuerySchema } from './portal.schemas.js';
import { listSubscriptions, getSubscription, listInvoices, getInvoice } from './portal.service.js';
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
export default router;
