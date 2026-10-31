# J-024: Add a local develop-to-main promotion gate

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/local-promotion-checks`; PR into `develop` (pending)
- Summary: Added root npm commands for tracked-file Prettier validation, a fresh local PostgreSQL migration and test run, client production build, and guarded develop-to-main PR creation. Added a pre-push hook that rejects direct pushes to `main`, plus README setup instructions.
- Decisions: Use a temporary database on the contributor's local PostgreSQL server, require a local `develop` checkout synchronized with `origin/develop`, and preserve the normal PR review/merge flow into `main`. Pin Prettier to version 3.9.6. Format existing tracked files so the new formatter gate passes on the current baseline.
- Database and migrations: No application schema or migration files changed. The gate applies the existing migrations to a disposable local database and drops it afterward.
- Checks and results: Full `npm run ci:local` passed against a disposable PostgreSQL 17 instance: Prettier check, four migrations applied, Prisma client generation, all 29 server tests, and client production build. The temporary database was removed. `git diff --check` passed before journal creation.
- Follow-ups: Open and link the PR into `develop`; contributors need local PostgreSQL with `CREATEDB` access, and `gh` authenticated to create the promotion PR.
