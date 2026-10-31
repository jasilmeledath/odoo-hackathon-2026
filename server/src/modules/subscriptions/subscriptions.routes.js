// Subscriptions, their lines and status workflow (PS-12, PS-13, PS-14).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { idParamSchema } from '../../lib/validation.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { subscriptionListQuerySchema, subscriptionWriteSchema } from './subscriptions.schemas.js';
import {
  getSubscription,
  getSubscriptionActivity,
  listSubscriptions,
  createSubscription,
  transitionSubscription,
  updateSubscription,
} from './subscriptions.service.js';

const router = Router();

router.use(requireAuth, requireRole(...STAFF_ROLES));

router.get('/', validate(subscriptionListQuerySchema, 'query'), async (req, res) => {
  res.json(await listSubscriptions(req.validQuery));
});

router.post('/', validate(subscriptionWriteSchema), async (req, res) => {
  res.status(201).json(await createSubscription(req.body, req.user));
});

router.put('/:id', validate(idParamSchema, 'params'), validate(subscriptionWriteSchema), async (req, res) => {
  res.json(await updateSubscription(req.validParams.id, req.body, req.user));
});

router.post('/:id/quote', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await transitionSubscription(req.validParams.id, 'QUOTE', req.user));
});

router.post('/:id/confirm', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await transitionSubscription(req.validParams.id, 'CONFIRM', req.user));
});

router.post('/:id/activate', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await transitionSubscription(req.validParams.id, 'ACTIVATE', req.user));
});

router.get('/:id/activity', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await getSubscriptionActivity(req.validParams.id));
});

router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await getSubscription(req.validParams.id));
});

export default router;
