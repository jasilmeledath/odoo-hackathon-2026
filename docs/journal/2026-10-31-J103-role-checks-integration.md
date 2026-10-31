# J-103: Integrate role-check documentation with current develop

- Date: 2026-10-31
- Contributor/agent: Jayasurya with Codex
- Branch / issue / PR: `fix/role-checks-review`; PR #123
- Summary: Integrate the role and customer-isolation regression documentation with the merged portal API, add-on and UI changes while preserving all route details.
- Decisions: Keep the role-check verification section and all portal endpoint documentation. The integrated portal endpoints are complete under PS-27. No production authorization behavior changes in this documentation update.
- Database and migrations: No schema, migration or database changes.
- Checks and results: Prettier and all 76 server tests passed. The production client build is pending. The repository does not define a `test:api-docs` npm script, so no standalone API-doc test was available.
- Follow-ups: Merge PR #123 after the integrated documentation checks pass.
