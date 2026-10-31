// Staff discount browsing; server roles protect the catalog (PS-19).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { idParamSchema } from '../../lib/validation.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { discountListQuerySchema } from './discounts.schemas.js';
import { getDiscount, listDiscounts } from './discounts.service.js';

const router = Router();
router.use(requireAuth, requireRole(...STAFF_ROLES));
router.get('/', validate(discountListQuerySchema, 'query'), async (req, res) => {
  res.json(await listDiscounts(req.validQuery));
});
router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await getDiscount(req.validParams.id));
});
export default router;
