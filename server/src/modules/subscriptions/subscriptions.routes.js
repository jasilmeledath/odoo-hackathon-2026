// Subscriptions, their lines and status workflow (PS-12, PS-13, PS-14).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { subscriptionListQuerySchema } from './subscriptions.schemas.js';
import { listSubscriptions } from './subscriptions.service.js';

const router = Router();

router.use(requireAuth, requireRole(...STAFF_ROLES));

router.get('/', validate(subscriptionListQuerySchema, 'query'), async (req, res) => {
  res.json(await listSubscriptions(req.validQuery));
});

export default router;
