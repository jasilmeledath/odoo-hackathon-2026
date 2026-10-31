// Invoices: list, read, confirm, cancel and send (PS-15 to PS-18).
import { Router } from 'express';
import { STAFF_ROLES } from '../../lib/constants.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { invoiceListQuerySchema } from './invoices.schemas.js';
import { listInvoices } from './invoices.service.js';

const router = Router();

router.use(requireAuth, requireRole(...STAFF_ROLES));

router.get('/', validate(invoiceListQuerySchema, 'query'), async (req, res) => {
  res.json(await listInvoices(req.validQuery));
});

export default router;
