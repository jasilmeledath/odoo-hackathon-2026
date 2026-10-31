# J-032: Confirm selected draft invoices

- Date: 2026-10-31
- Contributor/agent: Jasil M with Codex
- Branch / issue / PR: `feat/invoice-bulk-confirm-completion`; issue #43
- Summary: Add bounded bulk confirmation, current-page Draft selection, pending controls and confirmed/skipped/failed results.
- Decisions: Reuse the single-invoice service so state guards and audit entries cannot diverge. Deduplicate at the boundary; sort writes consistently.
- Database and migrations: No schema changes. Each invoice confirmation is independently transactional.
- Checks and results: Database regression covers drafts, already-confirmed/missing IDs, repeat requests and audit counts; Ten PostgreSQL integration tests and the client build passed. Visible Chrome verified both widths, current-page selection, real confirmation and result counts. Live API rejected empty, duplicate, negative and oversized selections.
- Follow-ups: Complete the scheduler next; payment recording remains a teammate dependency.
