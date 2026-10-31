// Bounded per-process attempt windows keyed by the connection IP (PS-29).
import { HttpError } from '../lib/errors.js';
const MS_PER_SECOND = 1000;
const WINDOW_MS = 15 * 60 * MS_PER_SECOND;
const CLEANUP_INTERVAL_MS = 60 * MS_PER_SECOND;
const MAX_CLIENTS = 10000;
export const LOGIN_ATTEMPT_LIMIT = 20;
export const RECOVERY_ATTEMPT_LIMIT = 5;
export const RESET_ATTEMPT_LIMIT = 10;

export function createAttemptLimiter({
  limit,
  windowMs = WINDOW_MS,
  maxClients = MAX_CLIENTS,
  now = () => Date.now(),
}) {
  const windows = new Map();
  let nextCleanupAt = 0;
  return (req, res, next) => {
    const timestamp = now();
    if (
      timestamp >= nextCleanupAt ||
      (windows.size >= maxClients && windows.values().next().value.expiresAt <= timestamp)
    ) {
      for (const [key, window] of windows) if (window.expiresAt <= timestamp) windows.delete(key);
      nextCleanupAt = timestamp + CLEANUP_INTERVAL_MS;
    }
    // Express trust proxy stays disabled: forwarded headers cannot choose the key.
    const key = req.ip;
    let window = windows.get(key);
    if (window?.expiresAt <= timestamp) {
      windows.delete(key);
      window = null;
    }
    const reject = (expiresAt) => {
      const waitSeconds = Math.max(1, Math.ceil((expiresAt - timestamp) / MS_PER_SECOND));
      res.set('Retry-After', String(waitSeconds));
      next(new HttpError(429, 'Too many attempts. Try again in ' + waitSeconds + ' seconds'));
    };
    if (!window) {
      // Never evict active windows: filling the map must not reset another client's limit.
      if (windows.size >= maxClients) return reject(windows.values().next().value.expiresAt);
      window = { count: 0, expiresAt: timestamp + windowMs };
      windows.set(key, window);
    }
    if (window.count >= limit) return reject(window.expiresAt);
    window.count += 1;
    next();
  };
}
export const limitLoginAttempts = createAttemptLimiter({ limit: LOGIN_ATTEMPT_LIMIT });
export const limitRecoveryAttempts = createAttemptLimiter({ limit: RECOVERY_ATTEMPT_LIMIT });
export const limitResetAttempts = createAttemptLimiter({ limit: RESET_ATTEMPT_LIMIT });
