# J-049: Add discount reads and derived states

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/discounts`; issue #35; read API PR pending
- Summary: Added staff discount list/detail routes with database-side state filtering, pagination, real product links, numeric percentages and date-only JSON.
- Decisions: User approved Scheduled and Inactive labels in addition to Active, Expired and Used up. Recorded A-24 precedence: Inactive, Expired, Used up, Scheduled, Active. IST boundaries are inclusive; no stored state.
- Database and migrations: No schema or migration changes. Six temporary rules were created and removed without modifying seeded rules.
- Checks and results: Forty-five automated tests, production client build and twenty-two live API checks passed, including all five states, null/bounded usage, pagination counts, inclusive dates, permissions and invalid filters. Pinned formatting and diff checks pass for changed source.
- Follow-ups: Add protected writes and the form/list in separate PRs. The checkout-wide formatting gate still fails on existing CRLF files; unrelated normalization remains declined.
