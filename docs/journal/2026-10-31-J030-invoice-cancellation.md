# J-030: Cancel unpaid invoices and restore billing

- Date: 2026-10-31
- Contributor/agent: Jasil M with Codex
- Branch / issue / PR: `feat/invoice-cancel-completion`; issue #27
- Summary: Add staff cancellation with a UI confirmation, shared action feedback, payment-history protection, exactly-once discount refunds and billing cursor rewinds.
- Decisions: Lock subscription before invoice; reject repeated cancellation and inconsistent discount usage. Keep paused/closed states unchanged.
- Database and migrations: No schema changes. Refund, state, cursor and activity writes commit or roll back together.
- Checks and results: Live PostgreSQL tests cover competing cancellations, discount refunds, rebilling and partial-payment refusal. Eight database regressions and the production build passed. Visible Chrome verified both widths, dismissing/accepting the confirmation, real cancellation and status feedback without page exceptions.
- Follow-ups: Print/send and bulk confirmation reuse the extracted actions.
