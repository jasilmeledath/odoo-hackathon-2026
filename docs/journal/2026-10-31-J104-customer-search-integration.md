# J-104: Integrate customer search fix with current develop

- Date: 2026-10-31
- Contributor/agent: Jayasurya with Codex
- Branch / issue / PR: `feat/form-ux-polish`; PR #124
- Summary: Synchronize the active-customer search fix with the merged portal API and documentation updates.
- Decisions: Keep `isActive` filtering in the customer database query before pagination so inactive records cannot hide billable customers from the first result page.
- Database and migrations: No schema, migration or database changes.
- Checks and results: Prettier, all 77 server unit tests, and the production client build passed after integration.
- Follow-ups: Merge PR #124 after the integrated checks pass.
