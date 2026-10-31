# J-031: record payments and settle invoice balances atomically

- Date: 2026-10-31
- Contributor/agent: Yadhu Krishna with Codex
- Branch / issue / PR: feat/payments-record; #9; PR pending
- Summary: Record part/final payments from invoice detail, serialize balance checks and log every committed payment.
- Decisions: Keep this issue on its own branch based on develop. Reuse shared UI/API helpers, role guards and field validation. No new runtime dependency.
- Database and migrations: No schema or migration change. Live verification created temporary fixtures and removed them afterward; seeded accounts and financial records were preserved.
- Checks and results: 21 live API/database checks and 12 browser checks passed. Headless Chrome checked 375 px and 1280 px, field errors and feature workflows, with no page exceptions or horizontal overflow. Client production build passed. Screenshots are in docs/screenshots. Session bootstrap in the isolated browser harness used the real database-backed auth guard; all feature requests used the actual API and PostgreSQL.
- Follow-ups: PS-22 is also served by the existing invoice list. Payment search/list is a separate PR for issue #10. No payment gateway is involved. Review and merge into develop.
