# J-077: customer subscription addons

- Date: 2026-10-31
- Contributor/agent: Yadhu Krishna P R with Codex
- Branch / issue / PR: fix/portal-addons-review; #32; [PR #122](https://github.com/jasilmeledath/odoo-hackathon-2026/pull/122); supersedes [PR #118](https://github.com/jasilmeledath/odoo-hackathon-2026/pull/118)
- Summary: Added Customer-only add-on switches, tenant-scoped mutation, plan-product protection, shared totals and atomic activity updates. Closed subscriptions reject changes. No-op requests do not duplicate activity.
- Decisions: Work independently from reviewed develop, with one branch and PR per issue. Follow PS-27, the engineering standards and Conventional Commits. Preserve existing feature branches at the user's request. Integrated develop 122148f, including the reviewed shared layout fix, before publication.
- Database and migrations: No schema, migration or dependency changes. Integration and browser checks use a newly migrated/seeded disposable database, removed afterward; the development database is untouched. Only intentional add-on mutations update application data at runtime.
- Checks and results: Seventy-six unit tests, six isolated PostgreSQL integration tests and twenty-two real-login browser checks at 375px/1280px passed. Tests cover bad boolean input, main-product protection, foreign IDs, wrong role, closed state, concurrent toggles and transaction rollback. Production build passed. Repository formatting and the required fast pre-push hook must also pass before publication. Browser screenshots are in docs/screenshots. No external services are mocked in the add-on flow; the role-menu harness returns an empty event stream because live dashboard delivery is outside its scope.
- Follow-ups: Publish into develop and request Jasil's review. PS-27 stays In progress: quotation acceptance and lifecycle actions belong to separately assigned issues. Keep the issue open until reviewer approval and merge without unresolved concerns.
