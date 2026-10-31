// Staff-only billing actions; calculations and persistence live in the services.
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { idParamSchema } from '../../lib/validation.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { HttpError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { billingRunSchema } from './billing.schemas.js';
import { billSubscription, runBilling } from './billingRun.service.js';
const router = Router();
router.use(requireAuth, requireRole(...STAFF_ROLES));
router.post('/run', validate(billingRunSchema), async (req, res) =>
  res.json(await runBilling({ actor: req.user })),
);
router.post(
  '/subscriptions/:id',
  validate(idParamSchema, 'params'),
  validate(billingRunSchema),
  async (req, res) => {
    if (!(await prisma.subscription.findUnique({ where: { id: req.validParams.id }, select: { id: true } })))
      throw new HttpError(404, 'Subscription not found');
    res.json(await billSubscription(req.validParams.id, { actor: req.user }));
  },
);
export default router;
