# J-027: Implement recurring billing execution

- Date: 2026-10-31
- Contributor/agent: Jasil M with Codex
- Branch / issue / PR: `feat/billing-run-completion`; issue #23
- Summary: Add staff-only single/all subscription billing, monthly anchors, catch-up periods, tax/customer snapshots, transactional numbering and cursor advancement, failure isolation and batches of 100 IDs.
- Decisions: Keep pure calculation separate from orchestration. Lock each subscription before reading its cursor; retain the live-period unique index as the final guard. Do not implement discount claims until #40.
- Database and migrations: No schema change or migration. Tests use a separately created/migrated/seeded local PostgreSQL database.
- Checks and results: Five live database regressions passed for catch-up/idempotence, simultaneous billing, expiry/paused/future exclusions, rollback and cursor rewinds. Seven live API permission/validation/run checks, 32 unit tests and the client production build also passed.
- Follow-ups: Billing page #24, discount claims #40 and scheduler #42 become available after this change.
