// Public customer registration (PS-1, PS-5).
import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { signupSchema } from './signup.schemas.js';
import { register } from './signup.service.js';
const router = Router();
router.post('/register', validate(signupSchema), async (req, res) =>
  res.status(201).json(await register(req.body)),
);
export default router;
