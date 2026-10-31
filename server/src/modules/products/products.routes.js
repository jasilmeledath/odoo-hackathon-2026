// Products and their variants (PS-6, PS-7).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { idParamSchema } from '../../lib/validation.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { productListQuerySchema, productSchema } from './products.schemas.js';
import { getProduct, listProducts, saveProduct } from './products.service.js';

const router = Router();
router.use(requireAuth, requireRole(...STAFF_ROLES));
router.get('/', validate(productListQuerySchema, 'query'), async (req, res) => {
  res.json(await listProducts(req.validQuery));
});
router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await getProduct(req.validParams.id));
});
router.post('/', requireRole('ADMIN'), validate(productSchema), async (req, res) => {
  res.status(201).json(await saveProduct(req.body));
});
router.put(
  '/:id',
  requireRole('ADMIN'),
  validate(idParamSchema, 'params'),
  validate(productSchema),
  async (req, res) => {
    res.json(await saveProduct(req.body, req.validParams.id));
  },
);
export default router;
