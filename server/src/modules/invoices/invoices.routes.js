// Invoices: list, read, confirm, cancel and send (PS-15 to PS-18).
import { Router } from 'express';
import { confirmInvoices } from './invoiceBulk.service.js';
import { sendInvoice } from './invoiceDelivery.service.js';
import { cancelInvoice } from './invoiceCancellation.service.js';
import { STAFF_ROLES } from '../../lib/constants.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { idParamSchema } from '../../lib/validation.js';
import { validate } from '../../middleware/validate.js';
import { invoiceListQuerySchema, bulkConfirmSchema } from './invoices.schemas.js';
import { confirmInvoice, getInvoice, listInvoices } from './invoices.service.js';

const router = Router();

router.use(requireAuth, requireRole(...STAFF_ROLES));

router.get('/', validate(invoiceListQuerySchema, 'query'), async (req, res) => {
  res.json(await listInvoices(req.validQuery));
});

router.post('/confirm-all', validate(bulkConfirmSchema), async (req, res) =>
  res.json(await confirmInvoices(req.body.invoiceIds, req.user)),
);

router.get('/:id', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await getInvoice(req.validParams.id));
});

router.post('/:id/confirm', validate(idParamSchema, 'params'), async (req, res) => {
  res.json(await confirmInvoice(req.validParams.id, req.user));
});
router.post('/:id/cancel', validate(idParamSchema, 'params'), async (req, res) =>
  res.json(await cancelInvoice(req.validParams.id, req.user)),
);

router.post('/:id/send', validate(idParamSchema, 'params'), async (req, res) =>
  res.json(await sendInvoice(req.validParams.id, req.user)),
);

export default router;
