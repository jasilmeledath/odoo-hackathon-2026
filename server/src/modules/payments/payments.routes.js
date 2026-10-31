// Staff payment search and recording share authentication and their respective validators.
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { paymentListSchema } from './payments.schemas.js';
import { listPayments } from './payments.service.js';
import { recordPaymentSchema } from './record.schemas.js';
import { recordPayment } from './record.service.js';
const router = Router();
router.use(requireAuth, requireRole('ADMIN', 'INTERNAL'));
router.get('/', validate(paymentListSchema, 'query'), async (req, res) =>
  res.json(await listPayments(req.validQuery)),
);
router.post('/', validate(recordPaymentSchema), async (req, res) =>
  res.status(201).json(await recordPayment(req.body, req.user.id)),
);
export default router;
