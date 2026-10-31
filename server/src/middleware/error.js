// The last stop for every request: turns errors into the standard response and
// keeps raw database and stack details away from the client.
import { HttpError } from '../lib/errors.js';

const PRISMA_ERRORS = {
  P2002: [409, 'That value is already in use'],
  P2003: [409, 'This record is still in use by other records'],
  P2025: [404, 'Record not found'],
};

// Prisma has no error code for CHECK constraints, so Postgres's own code is matched.
const POSTGRES_CHECK_VIOLATION = '23514';
const isCheckViolation = (err) =>
  err.name === 'PrismaClientUnknownRequestError' && err.message.includes(POSTGRES_CHECK_VIOLATION);

export const reportError = (error) => console.error(error);

export const notFound = (_req, _res, next) => next(new HttpError(404, 'Route not found'));

// Express identifies error middleware by its four arguments.
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, fields: err.fields });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (PRISMA_ERRORS[err.code]) {
    const [status, message] = PRISMA_ERRORS[err.code];
    return res.status(status).json({ error: message });
  }
  reportError(err);
  // Validation should stop bad data first; this is the database's safety net.
  if (isCheckViolation(err)) {
    return res.status(409).json({ error: 'That change breaks a business rule' });
  }
  res.status(500).json({ error: 'Something went wrong' });
};
