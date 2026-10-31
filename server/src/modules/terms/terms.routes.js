// Payment terms offered on subscriptions (PS-12).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { idParamSchema } from '../../lib/validation.js';
import { paymentTermSchema } from './terms.schemas.js';
import { listQuerySchema } from '../../lib/pagination.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { listPaymentTerms, savePaymentTerm } from './terms.service.js';

const router = Router();
router.use(requireAuth, requireRole(...STAFF_ROLES));
router.get('/', validate(listQuerySchema, 'query'), async (req, res) => {
  res.json(await listPaymentTerms(req.validQuery));
});
router.post('/', requireRole('ADMIN'), validate(paymentTermSchema), async (req, res) => {
  res.status(201).json(await savePaymentTerm(req.body));
});
router.put(
  '/:id',
  requireRole('ADMIN'),
  validate(idParamSchema, 'params'),
  validate(paymentTermSchema),
  async (req, res) => {
    res.json(await savePaymentTerm(req.body, req.validParams.id));
  },
);
export default router;
