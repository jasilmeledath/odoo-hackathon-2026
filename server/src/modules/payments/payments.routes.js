// Staff payment recording endpoint (PS-21, PS-22).
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { recordPaymentSchema } from './record.schemas.js';
import { recordPayment } from './record.service.js';
const router = Router();
router.use(requireAuth, requireRole('ADMIN', 'INTERNAL'));
router.post('/', validate(recordPaymentSchema), async (req, res) =>
  res.status(201).json(await recordPayment(req.body, req.user.id)),
);
export default router;
