// Parses req[source] with a Zod schema. Field errors come back as
// { field: message } so the UI can show each one under its input.
import { HttpError } from '../lib/errors.js';

export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        fields[key] ??= issue.message;
      }
      return next(new HttpError(400, 'Validation failed', fields));
    }
    // Express 5 makes req.query read-only, so parsed queries and params get their own keys.
    if (source === 'query') req.validQuery = result.data;
    else if (source === 'params') req.validParams = result.data;
    else req.body = result.data;
    next();
  };
