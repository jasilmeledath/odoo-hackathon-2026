// JWT sign-in helpers and the role guard (PS-2, PS-4).
import jwt from 'jsonwebtoken';
import { HttpError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

const TOKEN_LIFETIME = '8h';
const MS_PER_SECOND = 1000;
const SESSION_ENDED_MESSAGE = 'Session expired, please log in again';

// The token only proves who is calling. Role and customerId come from the
// database on every request, so a role change or deactivation applies at once.
export const signToken = ({ id, passwordChangedAt }) =>
  jwt.sign(
    {
      id,
      iat: Math.max(
        Math.floor(Date.now() / MS_PER_SECOND),
        Math.ceil((passwordChangedAt?.getTime() ?? 0) / MS_PER_SECOND),
      ),
    },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_LIFETIME },
  );

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const wasIssuedBefore = (payload, date) => date !== null && payload.iat * MS_PER_SECOND < date.getTime();

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
      role: true,
      isActive: true,
      passwordChangedAt: true,
      customer: { select: { id: true } },
    },
  });
  // PS-3: a password change ends every session started before it.
  if (!user?.isActive || wasIssuedBefore(payload, user.passwordChangedAt)) {
    throw new HttpError(401, SESSION_ENDED_MESSAGE);
  }

  // customerId is set for portal users, so portal queries can always scope to it.
  req.user = { id: user.id, name: user.name, role: user.role, customerId: user.customer?.id ?? null };
  next();
};

export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user.role) ? next() : next(new HttpError(403, 'You do not have access to this'));
