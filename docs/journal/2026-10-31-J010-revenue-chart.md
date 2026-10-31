# J-010: Add monthly payment revenue chart

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/reports-revenue-chart`; issue #38; PR pending
- Summary: Added a staff-only monthly revenue API and a responsive CSS bar chart. The API returns every month in the range, including zero-revenue months.
- Decisions: Revenue is based on received payments, grouped by calendar month in PostgreSQL. The default range is the last 12 months through today; explicit date bounds can be supplied.
- Database and migrations: No schema, migration, or database data changes. A parameterized raw SQL aggregate reads the existing `payments` table.
- Checks and results: Reviewed SQL parameterization, period/date handling, zero-month generation, and responsive twelve-column layout. `npm --prefix client run build`, `node --check` for the route/schema/service, and `git diff --check` passed.
- Follow-ups: Integrate the chart with the filtered report page from issue #37; keep that PR's date query in the URL.
