# J-011: Add live dashboard change notifications

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/dashboard-live`; issue #39; PR pending
- Summary: Added PostgreSQL notifications for invoice/payment writes, a reconnecting `LISTEN` client, an authenticated SSE endpoint, and an authenticated browser stream with bounded reconnect delays. Dashboard report queries reload after `changed` events.
- Decisions: PostgreSQL triggers publish only after the transaction commits; event payloads carry no financial/customer data. One server-side listener fans changes out to active SSE responses, avoiding per-dashboard database polling.
- Database and migrations: Added migration `20261031130000_dashboard_change_notifications` with triggers on `invoices` and `payments`; no Prisma model or column changes. Documented the triggers in `docs/data-model.md`.
- Checks and results: `npm --prefix client run build`, `node --check` for the event listener, report routes and server entry point, and `git diff --check` passed. Live PostgreSQL migration, notification, reconnect and disconnect-cleanup checks were not run in this task turn.
- Follow-ups: Verify notification delivery against local PostgreSQL and the payment/invoice workflows in issues #9, #21 and #56.
