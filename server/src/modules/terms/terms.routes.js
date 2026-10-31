// Payment terms offered on subscriptions (PS-12).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { listQuerySchema } from '../../lib/pagination.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { listPaymentTerms } from './terms.service.js';

const router = Router();
router.use(requireAuth, requireRole(...STAFF_ROLES));
router.get('/', validate(listQuerySchema, 'query'), async (req, res) => {
  res.json(await listPaymentTerms(req.validQuery));
});
export default router;
