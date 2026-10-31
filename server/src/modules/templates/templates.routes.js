// Admin template writes and staff catalog reads (PS-11, A-7).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { listQuerySchema } from '../../lib/pagination.js';
import { idParamSchema } from '../../lib/validation.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { templateSchema } from './templates.schemas.js';
import { getTemplate, listTemplates, saveTemplate } from './templates.service.js';

const router = Router();
router.use(requireAuth, requireRole(...STAFF_ROLES));
router.get('/', validate(listQuerySchema, 'query'), async (req, res) => {
  res.json(await listTemplates(req.validQuery));
});
router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await getTemplate(req.validParams.id));
});
router.post('/', requireRole('ADMIN'), validate(templateSchema), async (req, res) => {
  res.status(201).json(await saveTemplate(req.body));
});
router.put(
  '/:id',
  requireRole('ADMIN'),
  validate(idParamSchema, 'params'),
  validate(templateSchema),
  async (req, res) => {
    res.json(await saveTemplate(req.body, req.validParams.id));
  },
);
export default router;
