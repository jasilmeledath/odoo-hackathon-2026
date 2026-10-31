# J-050: Add protected discount writes

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/discount-writes`; issue #35; read [PR #101](https://github.com/jasilmeledath/odoo-hackathon-2026/pull/101)
- Summary: Added Admin create/update with mutually exclusive values, scope-specific product links, bounded minimums, inclusive dates and optional usage limits.
- Decisions: Keep usageCount read-only. Lock an edited discount against billing claims before validating the latest usage. Replace products atomically and preserve the counter when switching value types or scope.
- Database and migrations: No schema or migration changes. Scoped temporary rules/products were removed.
- Checks and results: Forty-seven automated tests and thirty-five live API checks passed, including permissions, invalid money/dates/scope, duplicate rollback, type/scope changes and a concurrent usage increment that blocks an unsafe limit decrease.
- Follow-ups: Publish the write PR, then reuse shared catalog selection for the discount form/list. Existing global CRLF formatting limitations remain; changed source is formatted.
