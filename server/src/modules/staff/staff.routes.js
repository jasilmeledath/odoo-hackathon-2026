// Staff routes are available only to administrators (PS-5).
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { idParamSchema } from '../../lib/validation.js';
import { listQuerySchema } from '../../lib/pagination.js';
import { createStaffSchema, updateStaffSchema } from './staff.schemas.js';
import { listStaff, saveStaff } from './staff.service.js';
const router = Router();
router.use(requireAuth, requireRole('ADMIN'));
router.get('/', validate(listQuerySchema, 'query'), async (req, res) =>
  res.json(await listStaff(req.validQuery)),
);
router.post('/', validate(createStaffSchema), async (req, res) =>
  res.status(201).json(await saveStaff(null, req.body)),
);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateStaffSchema), async (req, res) =>
  res.json(await saveStaff(req.validParams.id, req.body)),
);
export default router;
