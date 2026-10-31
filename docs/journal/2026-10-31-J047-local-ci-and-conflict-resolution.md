# J-047: Keep CI local and resolve the README conflict

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `ci/automatic-ci-workflow`; PR #87 — https://github.com/jasilmeledath/odoo-hackathon-2026/pull/87
- Summary: Added local-only CI and the guarded main-promotion flow. Merged the latest `develop` changes into the PR branch and resolved its README conflict while retaining the project documentation and current feature list.
- Decisions: Feature-branch pushes run Prettier and server tests; pushes to `develop` run full `ci:local`; direct pushes to `main` are blocked. Promotion requires `develop`, a clean working tree including untracked files, and an exact match with `origin/develop` before running the full gate. The promotion PR description records the checked commit SHA. Keep the full README and include the scheduler, customer, and signup features from `develop`.
- Database and migrations: No application schema or migration changes. The full gate applies existing migrations to a disposable local PostgreSQL database and removes it afterward.
- Checks and results: After merging `develop`, `npm run ci:local` passed formatting, four PostgreSQL migrations, all 43 server tests, and the client build; its temporary database was removed. Earlier `npm run ci:fast` passed Prettier and all 32 pre-merge server tests. The hook rejected a simulated direct push to `main`. Conflict markers were removed and `git diff --cached --check` passed.
- Follow-ups: Each clone must install dependencies, configure local PostgreSQL in `server/.env`, and enable hooks with `git config core.hooksPath .githooks`. The team must confirm `npm run promote:main` passed for the same commit before merging the promotion PR.
