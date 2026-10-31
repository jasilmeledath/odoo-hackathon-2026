# J-032: Run CI locally and gate main promotion

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `ci/automatic-ci-workflow`; PR #87 — https://github.com/jasilmeledath/odoo-hackathon-2026/pull/87
- Summary: Added fast and full local CI commands, a branch-aware pre-push hook, and a guarded `develop`-to-`main` promotion command. Documented one-time setup and the team promotion process in the README.
- Decisions: Feature-branch pushes run Prettier and server tests; pushes to `develop` run full `ci:local`; direct pushes to `main` are blocked. Promotion requires the current branch to be `develop`, a clean tree including untracked files, an exact match with `origin/develop`, and a passing full gate before creating or refreshing the PR description with the checked SHA.
- Database and migrations: No application schema or migration changes. The full gate applies existing migrations to a disposable local PostgreSQL database and removes it afterward.
- Checks and results: `npm run ci:fast` passed formatting and all 32 server tests. Simulated a `develop` push through the hook; four migrations, all 32 tests, and the client build passed. Confirmed direct `main` pushes are blocked. `sh -n .githooks/pre-push`, `node --check scripts/promote-to-main.js`, and `git diff --cached --check` passed.
- Follow-ups: Each clone must install dependencies, configure local PostgreSQL in `server/.env`, and enable the hook with `git config core.hooksPath .githooks`. The team must confirm `npm run promote:main` passed for the same commit before merging its promotion PR.
