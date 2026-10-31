# J-008: Add finance dashboard and renewal reporting

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/dashboard`; issue #21; PR pending
- Summary: Added staff-only summary and renewal APIs, plus dashboard metric cards, overdue invoice rows, and a renewal list driven by live API data.
- Decisions: Revenue is aggregated from payments by payment date. MRR and invoice totals use database aggregates. Overdue is computed from confirmed invoice due dates. The renewal list includes near-term expiries and expired active subscriptions only when the plan does not auto-close.
- Database and migrations: No schema, migration, or database data changes. Existing status and date indexes support the aggregate and list predicates.
- Checks and results: Reviewed date-range validation, database aggregate queries, pagination, overdue definition, renewal cutoff and dashboard loading/error/empty states. Runtime tests and browser viewport checks were not run in this task turn.
- Follow-ups: Add report-page filters and monthly revenue chart in issues #37 and #38; connect live updates in issue #39.
