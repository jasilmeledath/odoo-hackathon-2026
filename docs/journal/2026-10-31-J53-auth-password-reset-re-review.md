# J-53: Prepare auth-password-reset for re-review

- Date: 2026-10-31
- Contributor/agent: Yadhu Krishna with Codex
- Branch / issue / PR: feat/auth-password-reset; #7; PR #92
- Summary: Integrate current develop, preserving registration, customer and payment routes and the reviewer-approved invoice UI. Retain the precise signed password-version fix and monotonic password writes.
- Decisions: Keep this issue independent and request review again on the existing PR. Do not close it while changes are still requested. Retain every feature branch.
- Database and migrations: No application schema or migration changes. Three persistent real-service regressions passed on a disposable migrated PostgreSQL database, which was removed after testing.
- Checks and results: Forty-seven unit tests and production build passed with the security fix. The same-second old-session/new-login scenario, an intervening login between successive changes, and same-millisecond writes all passed in isolated PostgreSQL. The final push runs the repository fast formatting/test gate.
- Follow-ups: Reviewer confirmation, then merge and issue closure without branch deletion.
