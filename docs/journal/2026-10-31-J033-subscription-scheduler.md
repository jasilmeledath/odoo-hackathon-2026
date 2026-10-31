# J-033: Schedule activation, expiry and billing

- Date: 2026-10-31
- Contributor/agent: Jasil M with Codex
- Branch / issue / PR: `feat/scheduler-completion`; issue #42
- Summary: Run conditional, audited transitions in batches before billing at startup and hourly. Stop cleanly and await in-flight work on shutdown.
- Decisions: Keep transition writes in the subscriptions module. Preserve Active status for plans without automatic expiry closing. Log and isolate phase failures; use database guards across app instances.
- Database and migrations: No schema changes. All state changes use existing enums, fields, constraints and audit records.
- Checks and results: Live PostgreSQL regression covers due/future activation, close-before-bill, retained Active expiry, repeat runs and handled billing failure. Eleven real PostgreSQL integration regressions passed, including scheduler error recovery. Scheduler start, duplicate start and graceful stop passed. Unit tests, production build and startup health are verified before publishing.
- Follow-ups: Other PS-14 manual pause/renewal work remains assigned to teammates.
