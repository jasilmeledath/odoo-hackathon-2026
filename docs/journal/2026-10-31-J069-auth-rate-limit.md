# J-069: limit repeated login and password reset attempts

- Date: 2026-10-31
- Contributor/agent: Yadhu Krishna with Codex
- Branch / issue / PR: feat/auth-rate-limit; #33; PR pending
- Summary: Add bounded per-IP attempt windows to login, forgot-password and reset-password without a new dependency.
- Decisions: This issue has no outstanding prerequisite against develop. Keep a separate feature branch and PR. Reuse shared pagination, auth, validation, UI and formatting helpers. Use separate connection-IP windows, reject forwarded-header spoofing and bound memory without evicting active limits.
- Database and migrations: No schema or migration change. Applied existing migrations and seed to a disposable local PostgreSQL database for API/browser verification, then removed it. No development data was changed.
- Checks and results: 62 unit tests, 1 persistent isolated PostgreSQL/API integration tests and 14 browser checks passed. Chrome checked 375 px and 1280 px with no page exceptions or horizontal overflow. Production client build passed. Real route checks cover normal use, all three 429 responses and Retry-After; browser forms show the wait message.
- Follow-ups: Counters are local to one API process and reset on restart; they are not shared across multiple workers. Request review from Jasil. Retain all feature branches as requested.
