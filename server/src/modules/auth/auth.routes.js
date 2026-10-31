// Sign-up, login, current user and password reset (PS-1, PS-2, PS-3).
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema } from './auth.schemas.js';
import { login } from './auth.service.js';

const router = Router();
router.post('/login', validate(loginSchema), async (req, res) => res.json(await login(req.body)));
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
