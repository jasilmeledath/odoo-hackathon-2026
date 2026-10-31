# J-032: Add automatic GitHub Actions CI

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `ci/automatic-ci-workflow`; PR into `develop` (pending)
- Summary: Added a GitHub Actions workflow for pull requests to `develop` and `main` and pushes to `develop`. It provisions PostgreSQL and runs the existing local promotion gate. Updated README instructions and documented the required main-branch status check.
- Decisions: Reuse `npm run ci:local` so hosted and local checks stay aligned. Reject main-target PRs unless the source is this repository's `develop` branch. Grant the workflow read-only repository contents access.
- Database and migrations: No application schema, migration, or local database changes. CI creates a disposable PostgreSQL service database for the existing migration and test checks.
- Checks and results: Prettier formatted the workflow; the repository formatting check and `git diff --check` passed. No GitHub Actions run was available before the workflow is merged and the account can run Actions jobs.
- Follow-ups: Merge the workflow PR, resolve the repository billing restriction, and require `CI / Verify formatting, database migrations, server tests, and client build` for the `main` branch.
