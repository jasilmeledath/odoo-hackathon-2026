# J-004: Require Conventional Commits for all commits

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `docs/work-journal-policy`; PR pending
- Summary: Made Conventional Commits an explicit mandatory rule in the engineering standards and coding-agent instructions, alongside the existing detailed requirements in `CONTRIBUTING.md`.
- Decisions: Every commit, including documentation and maintenance commits, must follow the Conventional Commits format and pass the repository hook. The hook must not be bypassed.
- Database and migrations: No schema, migration, or database data changes.
- Checks and results: Documentation diff checked with `git diff --check`.
- Follow-ups: Include this rule in future contributor and agent instructions; add the PR link in a follow-up journal entry when available.
