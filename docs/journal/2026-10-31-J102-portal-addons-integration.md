# J-102: Integrate portal add-ons with merged customer actions

- Date: 2026-10-31
- Contributor/agent: Jayasurya with Codex
- Branch / issue / PR: `fix/portal-addons-review`; issue #32; PR #122
- Summary: Integrate the add-on routes and switch into the merged quotation acceptance and subscription lifecycle flows. Resolve route, schema, shared detail view and API documentation conflicts.
- Decisions: Keep the portal actions behind customer authentication, preserve the shared subscription row lock behavior, and mark PS-27 complete because acceptance, add-on management and lifecycle actions are all integrated. Keep the UI changes and endpoint documentation aligned with the merged routes.
- Database and migrations: No schema, migration or database changes.
- Checks and results: Prettier check, all 76 server tests and the production client build passed after conflict resolution. The six PostgreSQL add-on integration tests were previously reported passing on an isolated database; they were not rerun because no disposable test database was configured in this worktree.
- Follow-ups: Merge replacement PR #122 after the updated branch is pushed.
