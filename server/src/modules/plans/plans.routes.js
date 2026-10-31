// Plans and their closing, pausing and renewal options (PS-8, PS-9).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { idParamSchema } from '../../lib/validation.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { planListQuerySchema } from './plans.schemas.js';
import { getPlan, listPlans } from './plans.service.js';

const router = Router();
router.use(requireAuth, requireRole(...STAFF_ROLES));
router.get('/', validate(planListQuerySchema, 'query'), async (req, res) => {
  res.json(await listPlans(req.validQuery));
});
router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await getPlan(req.validParams.id));
});
export default router;
