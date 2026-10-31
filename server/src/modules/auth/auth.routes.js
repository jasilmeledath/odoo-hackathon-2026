// Sign-up, login, current user and password reset (PS-1, PS-2, PS-3).
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema } from './auth.schemas.js';
import { login } from './auth.service.js';

import { signupSchema } from './signup.schemas.js';
import { register } from './signup.service.js';

import { forgotPasswordSchema, resetPasswordSchema } from './reset.schemas.js';
import { forgotPassword, resetPassword } from './reset.service.js';

const router = Router();
router.post('/login', validate(loginSchema), async (req, res) => res.json(await login(req.body)));
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

router.post('/register', validate(signupSchema), async (req, res) =>
  res.status(201).json(await register(req.body)),
);

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) =>
  res.json(await forgotPassword(req.body)),
);
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) =>
  res.json(await resetPassword(req.body)),
);

export default router;
