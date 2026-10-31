// Public password-recovery endpoints (PS-3).
import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { forgotPasswordSchema, resetPasswordSchema } from './reset.schemas.js';
import { forgotPassword, resetPassword } from './reset.service.js';
const router = Router();
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) =>
  res.json(await forgotPassword(req.body)),
);
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) =>
  res.json(await resetPassword(req.body)),
);
export default router;
