// JWT sign-in helpers and the role guard (PS-2, PS-4).
import jwt from 'jsonwebtoken';
import { HttpError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import { passwordVersion, matchesPasswordVersion } from '../lib/sessions.js';

const TOKEN_LIFETIME = '8h';
const SESSION_ENDED_MESSAGE = 'Session expired, please log in again';

// The token only proves who is calling. Role and customerId come from the
// database on every request, so a role change or deactivation applies at once.
export const signToken = (user) =>
  jwt.sign({ id: user.id, passwordVersion: passwordVersion(user) }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_LIFETIME,
  });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const requireAuth = async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in');

  const payload = verifyToken(token);
  if (!payload) throw new HttpError(401, SESSION_ENDED_MESSAGE);

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      passwordChangedAt: true,
      customer: { select: { id: true } },
    },
  });
  // PS-3/PS-5: compare exact signed versions; roles still come only from the database.
  if (!user?.isActive || !matchesPasswordVersion(payload, user)) {
    throw new HttpError(401, SESSION_ENDED_MESSAGE);
  }

  // customerId is set for portal users, so portal queries can always scope to it.
  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    customerId: user.customer?.id ?? null,
  };
  next();
};

export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user.role) ? next() : next(new HttpError(403, 'You do not have access to this'));
