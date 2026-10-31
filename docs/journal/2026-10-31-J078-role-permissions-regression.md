# J-078: role permissions regression

- Date: 2026-10-31
- Contributor/agent: Yadhu Krishna P R with Codex
- Branch / issue / PR: `test/role-checks`; #12; [PR #119](https://github.com/jasilmeledath/odoo-hackathon-2026/pull/119) (original review; replacement linked in review follow-up)
- Summary: Added persistent API regressions proving role guards across staff, catalog and portal modules, foreign-record 404 parity, database-authoritative identity and missing-authentication rejection. Production behavior is unchanged.
- Decisions: Work independently from reviewed develop, with one branch and PR per issue. Follow PS-4, the engineering standards and Conventional Commits. Preserve existing feature branches at the user's request. Integrated develop 122148f, including the reviewed shared layout fix, before publication.
- Database and migrations: No schema, migration or dependency changes. Integration and browser checks use a newly migrated/seeded disposable database, removed afterward; the development database is untouched. The regression suite performs no application-data mutations.
- Checks and results: Seventy-three unit tests, seven isolated PostgreSQL integration tests and fifty-four real-login browser checks at 375px/1280px passed. Verified role menus, direct Admin-only navigation, no overflow and no page exceptions. Production build passed. Repository formatting and the required fast pre-push hook must also pass before publication. Browser screenshots are in docs/screenshots. No external services are mocked in the add-on flow; the role-menu harness returns an empty event stream because live dashboard delivery is outside its scope.
- Follow-ups: Publish into develop and request Jasil's review. Mark PS-4 Done after the proven permission matrix. Keep the issue open until reviewer approval and merge without unresolved concerns.
