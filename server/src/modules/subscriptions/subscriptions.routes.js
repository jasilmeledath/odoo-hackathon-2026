// Subscriptions, their lines and status workflow (PS-12, PS-13, PS-14).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { idParamSchema } from '../../lib/validation.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { subscriptionListQuerySchema, subscriptionRenewSchema } from './subscriptions.schemas.js';
import {
  getSubscription,
  getSubscriptionActivity,
  listSubscriptions,
  manageSubscription,
  transitionSubscription,
} from './subscriptions.service.js';

const router = Router();

router.use(requireAuth, requireRole(...STAFF_ROLES));

router.get('/', validate(subscriptionListQuerySchema, 'query'), async (req, res) => {
  res.json(await listSubscriptions(req.validQuery));
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

router.post('/:id/pause', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await manageSubscription(req.validParams.id, 'PAUSE', req.user));
});

router.post('/:id/resume', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await manageSubscription(req.validParams.id, 'RESUME', req.user));
});

router.post(
  '/:id/renew',
  validate(idParamSchema, 'params'),
  validate(subscriptionRenewSchema),
  async (req, res) => {
    res.json(await manageSubscription(req.validParams.id, 'RENEW', req.user, req.body));
  },
);

router.post('/:id/close', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await manageSubscription(req.validParams.id, 'CLOSE', req.user));
});

router.get('/:id/activity', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await getSubscriptionActivity(req.validParams.id));
});

router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await getSubscription(req.validParams.id));
});

export default router;
