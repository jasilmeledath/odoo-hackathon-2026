# J-028: Claim billing discounts safely

- Date: 2026-10-31
- Contributor/agent: Jasil M with Codex
- Branch / issue / PR: `feat/billing-discount-completion`; issue #40
- Summary: Integrate current eligible rules into invoice calculation and atomically claim one usage per invoice.
- Decisions: Compare usage count and update timestamp so stale rules cannot be claimed; recompute without a lost claim. All changes remain inside the invoice transaction.
- Database and migrations: No schema changes. Existing usage checks and invoice foreign keys protect the write.
- Checks and results: Six PostgreSQL integration tests passed, including two subscriptions competing for one remaining use. All 32 unit tests passed.
- Follow-ups: Cancellation must return exactly one usage in #27.
