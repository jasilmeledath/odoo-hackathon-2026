// Tax rules. Admin writes, staff reads (PS-10).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { idParamSchema } from '../../lib/validation.js';
import { taxSchema } from './taxes.schemas.js';
import { listQuerySchema } from '../../lib/pagination.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { listTaxes, saveTax } from './taxes.service.js';

const router = Router();
router.use(requireAuth, requireRole(...STAFF_ROLES));
router.get('/', validate(listQuerySchema, 'query'), async (req, res) => {
  res.json(await listTaxes(req.validQuery));
});
router.post('/', requireRole('ADMIN'), validate(taxSchema), async (req, res) => {
  res.status(201).json(await saveTax(req.body));
});
router.put(
  '/:id',
  requireRole('ADMIN'),
  validate(idParamSchema, 'params'),
  validate(taxSchema),
  async (req, res) => {
    res.json(await saveTax(req.body, req.validParams.id));
  },
);
export default router;
