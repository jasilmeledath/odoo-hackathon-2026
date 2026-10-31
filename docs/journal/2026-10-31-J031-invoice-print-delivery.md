# J-031: Print and send invoice snapshots

- Date: 2026-10-31
- Contributor/agent: Jasil M with Codex
- Branch / issue / PR: `feat/invoice-print-send-completion`; issue #41
- Summary: Add print layout/action, plaintext snapshot delivery, sent timestamps, timeline logging and graceful SMTP failure feedback.
- Decisions: Reuse the mail helper and terminal fallback. Do not mark failed delivery as sent. Document that SMTP and PostgreSQL cannot commit atomically.
- Database and migrations: No schema changes. Timestamp and success log share a transaction after delivery.
- Checks and results: Live database regression checks success and failed delivery. Nine database regressions and the client build passed. Visible Chrome verified responsive controls, real terminal-fallback delivery, sent timestamp feedback, and print-media hiding of navigation/actions/back links.
- Follow-ups: Configure SMTP only when real delivery is needed.
