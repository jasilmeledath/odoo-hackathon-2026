// JWT sign-in helpers and the role guard (PS-2, PS-4).
import jwt from 'jsonwebtoken';
import { HttpError } from '../lib/errors.js';

const TOKEN_LIFETIME = '8h';

// customerId is set for portal users, so portal queries can always scope to it.
export const signToken = ({ id, role, name, customerId = null }) =>
  jwt.sign({ id, role, name, customerId }, process.env.JWT_SECRET, { expiresIn: TOKEN_LIFETIME });

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Please log in'));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new HttpError(401, 'Session expired, please log in again'));
  }
};

export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user.role) ? next() : next(new HttpError(403, 'You do not have access to this'));
