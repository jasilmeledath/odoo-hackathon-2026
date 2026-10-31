# J-51: Fix reviewer-reported session revocation

- Date: 2026-10-31
- Contributor/agent: Yadhu Krishna with Codex
- Branch / issue / PR: feat/auth-password-reset; #7; PR #92
- Summary: Replace whole-second/future JWT timestamp comparisons with an exact signed passwordVersion matched to the current database passwordChangedAt. Retain standard JWT iat semantics.
- Decisions: Password changes use monotonic millisecond versions under an account row lock, including successive writes in one millisecond. Tokens never carry authorization roles. Existing tokens without a version work only for accounts that have never changed their password. The same implementation is included independently in the reset and staff branches.
- Database and migrations: No schema or migration. Tests use temporary accounts; isolated integration tests create and remove a disposable migrated local PostgreSQL database.
- Checks and results: 47 automated unit tests and client production build passed. Real PostgreSQL checks reproduced same-second changes, an intervening login and same-millisecond updates; old sessions were rejected and fresh credentials worked. Three persistent integration regressions cover the actual password-write service in an isolated database.
- Follow-ups: Merge current develop, rerun the combined checks, request re-review and leave the issue open until approval. Retain feature branches.
