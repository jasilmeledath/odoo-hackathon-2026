// Staff payment list endpoint (PS-21).
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { paymentListSchema } from './payments.schemas.js';
import { listPayments } from './payments.service.js';
const router = Router();
router.use(requireAuth, requireRole('ADMIN', 'INTERNAL'));
router.get('/', validate(paymentListSchema, 'query'), async (req, res) =>
  res.json(await listPayments(req.validQuery)),
);
export default router;
