// Products and their variants (PS-6, PS-7).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { idParamSchema } from '../../lib/validation.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  productListQuerySchema,
  productSchema,
  variantSchema,
  variantParamsSchema,
} from './products.schemas.js';
import { getProduct, listProducts, saveProduct, saveVariant, removeVariant } from './products.service.js';

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
router.post(
  '/:id/variants',
  requireRole('ADMIN'),
  validate(idParamSchema, 'params'),
  validate(variantSchema),
  async (req, res) => {
    res.status(201).json(await saveVariant(req.validParams.id, req.body));
  },
);
router.put(
  '/:id/variants/:variantId',
  requireRole('ADMIN'),
  validate(variantParamsSchema, 'params'),
  validate(variantSchema),
  async (req, res) => {
    res.json(await saveVariant(req.validParams.id, req.body, req.validParams.variantId));
  },
);
router.delete(
  '/:id/variants/:variantId',
  requireRole('ADMIN'),
  validate(variantParamsSchema, 'params'),
  async (req, res) => {
    await removeVariant(req.validParams.id, req.validParams.variantId);
    res.sendStatus(204);
  },
);
export default router;
