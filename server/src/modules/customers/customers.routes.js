// Staff-only customer endpoints (PS-4, PS-12).
import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { listQuerySchema } from '../../lib/pagination.js';
import { idParamSchema } from '../../lib/validation.js';
import { customerSchema } from './customers.schemas.js';
import { listCustomers, getCustomer, saveCustomer } from './customers.service.js';
const router = Router();
router.use(requireAuth, requireRole('ADMIN', 'INTERNAL'));
router.get('/', validate(listQuerySchema, 'query'), async (req, res) =>
  res.json(await listCustomers(req.validQuery)),
);
router.post('/', validate(customerSchema), async (req, res) =>
  res.status(201).json(await saveCustomer(null, req.body)),
);
router.get('/:id', validate(idParamSchema, 'params'), async (req, res) =>
  res.json(await getCustomer(req.validParams.id)),
);
router.put('/:id', validate(idParamSchema, 'params'), validate(customerSchema), async (req, res) =>
  res.json(await saveCustomer(req.validParams.id, req.body)),
);
export default router;
