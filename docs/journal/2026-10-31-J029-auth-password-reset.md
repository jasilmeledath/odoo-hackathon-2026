# J-029: recover passwords with single-use hashed links

- Date: 2026-10-31
- Contributor/agent: Yadhu Krishna with Codex
- Branch / issue / PR: feat/auth-password-reset; #7; PR pending
- Summary: Add forgot/reset pages, 30-minute hashed recovery tokens and immediate session invalidation, including the same-second boundary.
- Decisions: Keep this issue on its own branch based on develop. Reuse shared UI/API helpers, role guards and field validation. No new runtime dependency.
- Database and migrations: No schema or migration change. Live verification created temporary fixtures and removed them afterward; seeded accounts and financial records were preserved.
- Checks and results: 10 live API/database checks and 12 browser checks passed. Headless Chrome checked 375 px and 1280 px, field errors and feature workflows, with no page exceptions or horizontal overflow. Client production build passed. Screenshots are in docs/screenshots. Session bootstrap in the isolated browser harness used the real database-backed auth guard; all feature requests used the actual API and PostgreSQL.
- Follow-ups: Rate limiting is excluded because issue #33 has declared dependencies. SMTP-free delivery was tested; an external SMTP account was not configured. Review and merge into develop.
