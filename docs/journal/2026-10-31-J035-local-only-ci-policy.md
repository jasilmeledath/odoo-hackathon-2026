# J-035: Keep CI local and gate develop promotion

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `ci/automatic-ci-workflow`; PR #87 — https://github.com/jasilmeledath/odoo-hackathon-2026/pull/87
- Summary: Removed the GitHub Actions workflow from the PR. Added fast feature-branch checks and full `develop` push checks, retained the direct-push block for `main`, and tightened the develop-to-main promotion gate.
- Decisions: Keep `npm run ci:local` as the full local gate and `npm run ci:fast` as Prettier plus server tests. The promotion command requires `develop`, a clean tree including untracked files, and an exact match with `origin/develop` before running the full gate and creating or refreshing the PR description with the checked commit SHA.
- Database and migrations: No application schema or migration changes. Full CI applies existing migrations to a disposable local PostgreSQL database and removes it afterward.
- Checks and results: `sh -n .githooks/pre-push`, `node --check scripts/promote-to-main.js`, `npm run ci:fast` (Prettier and all 32 server tests), and `git diff --cached --check` passed. Simulating a push to `develop` through the hook passed the full gate: four migrations, 32 server tests, and client build. The feature-branch push will rerun the fast gate through the pre-push hook.
- Follow-ups: Enable hooks once in each clone with `git config core.hooksPath .githooks`. J-032 and J-033 record the interim hosted-workflow attempt; this entry records its removal and the current local-only policy. The journal remains append-only.
