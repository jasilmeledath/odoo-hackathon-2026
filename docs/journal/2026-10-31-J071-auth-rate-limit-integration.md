# J-071: Integrate auth-rate-limit for review

- Date: 2026-10-31
- Contributor/agent: Yadhu Krishna with Codex
- Branch / issue / PR: feat/auth-rate-limit; #33; PR pending
- Summary: Merge current develop's subscription draft and lifecycle changes while preserving this independent issue's portal/auth implementation.
- Decisions: Keep one issue per feature branch, use Conventional Commits and retain all branches after review. No replacement PR is needed for earlier changes because those review fixes are already approved and merged.
- Database and migrations: No schema or migration change. Existing migrations and seed were applied to a disposable PostgreSQL database for this task's integration/browser tests, then the database was removed.
- Checks and results: Initial verification passed 62 unit tests, 1 API/database integration tests and 14 browser checks at 375 px and 1280 px. The integrated branch runs the pinned formatter, complete unit suite and production build before push.
- Follow-ups: Open the PR into develop and request Jasil's review. Counters are local to one API process and reset on restart; they are not shared across multiple workers.
