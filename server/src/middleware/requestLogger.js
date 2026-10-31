// Logs one line per API request (method, path, status, time), so a failed or
// slow call can be traced from the server terminal. The query string is left
// out on purpose: it can hold search text and other user input.
export const requestLogger = (req, res, next) => {
  const startedAt = performance.now();
  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startedAt);
    console.info(`${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
  });
  next();
};
