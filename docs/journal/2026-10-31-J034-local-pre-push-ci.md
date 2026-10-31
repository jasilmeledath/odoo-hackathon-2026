# J-034: Run local CI before branch pushes

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `ci/automatic-ci-workflow`; PR #87 — https://github.com/jasilmeledath/odoo-hackathon-2026/pull/87
- Summary: Updated the repository pre-push hook to run the local CI gate before branch pushes. Kept the direct-push block for `main` and documented the local fallback in the README.
- Decisions: Reuse `npm run ci:local` so local pushes and the hosted workflow execute the same formatting, PostgreSQL migration, server test, and client build checks. The hook must be enabled with `git config core.hooksPath .githooks`.
- Database and migrations: No application schema or migration changes. The local gate applies existing migrations to a temporary local PostgreSQL database and removes it afterward.
- Checks and results: `sh -n .githooks/pre-push`, `npm run check:format`, and `git diff --check` passed. `npm run ci:local` passed against local PostgreSQL: four migrations applied, all 32 tests passed, and the client production build completed. The temporary database was removed. GitHub Actions remains blocked by the account billing lock.
- Follow-ups: Enable the hook in each clone. Restore GitHub Actions billing to receive hosted PR checks and require the CI check in `main` branch protection.
