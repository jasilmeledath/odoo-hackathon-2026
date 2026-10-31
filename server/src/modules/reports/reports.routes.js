// Finance summary and filtered reports (PS-23, PS-24).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { getMonthlyRevenue } from './revenue.service.js';
import { revenueQuerySchema } from './revenue.schemas.js';

const router = Router();

router.use(requireAuth, requireRole(...STAFF_ROLES));

router.get('/revenue', validate(revenueQuerySchema, 'query'), async (req, res) => {
  res.json(await getMonthlyRevenue(req.validQuery));
});

export default router;
