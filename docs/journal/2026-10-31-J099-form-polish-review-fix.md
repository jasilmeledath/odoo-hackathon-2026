# J-099: Fix customer search filtering in form polish

- Date: 2026-10-31
- Contributor/agent: Jayasurya with Codex
- Branch / issue / PR: `feat/form-ux-polish`; PR #124
- Summary: Filter active customers in the database before the 20-result search page is applied. Renumber the form-polish entry to J-093 to avoid collisions with other open PRs.
- Decisions: Extend the customer list query with a strict string-boolean `isActive` filter, use it from the subscription picker, and document the API query parameter. Keep matching and pagination on the server.
- Database and migrations: No schema, migration or database changes.
- Checks and results: Repository formatting passed; the customer active-filter schema regression passed; all 74 server unit tests passed; the production client build passed.
- Follow-ups: Merge after the integrated branch passes the required local checks.
