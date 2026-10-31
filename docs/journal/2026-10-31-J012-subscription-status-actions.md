# J-012: Add subscription quote, confirm and activate actions

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/subscription-status`; issue #20; PR pending, stacked on PR #60
- Summary: Added staff actions for Draft → Quotation → Confirmed → Active, status guards with atomic conditional updates, activity logging, and detail-page controls for the action allowed by the current status.
- Decisions: Quote expiry comes from the selected template; subscriptions without a template use a 30-day default. Confirmation uses the IST business-date helper. Activation sets `nextInvoiceDate` to `startDate`.
- Database and migrations: No schema, migration, or database data changes.
- Checks and results: `npm --prefix client run build`, `node --check` for the subscription routes/service, and `git diff --check` passed. Browser and live database checks were not run in this task turn.
- Follow-ups: Add plan-gated pause, resume, renew and early close actions in issue #30.
