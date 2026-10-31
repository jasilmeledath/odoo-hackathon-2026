# J-001: Project baseline and documentation updates

- Date: 2026-10-31
- Contributor/agent: Project team; journal entry prepared by Codex
- Branch / issue / PR: Initial setup PR #1; ER diagram PR #50; API naming PR #51; promoted to `main` by PR #52
- Summary: Established the Brightloop subscription management application. The setup includes a React/Vite client, Express API scaffold, PostgreSQL/Prisma schema with migrations and seed data, shared middleware/helpers, requirements and engineering documentation. The database reference documents all 19 tables and their relationships. PR #50 completed the ER diagram's table coverage; PR #51 clarified how canonical `/api` routes relate to paths relative to the API reference base URL.
- Decisions: Use a modular monolith with local PostgreSQL. Keep database schema and migrations as the source of truth; use integer paise for money and protect important business invariants with database constraints.
- Database and migrations: Initial schema and business-rule migrations were introduced in setup PR #1. PRs #50, #51 and #52 were documentation/promotion changes and did not change the database schema or migrations.
- Checks and results: The original setup and documentation PRs were merged. PR #50 reports Mermaid rendering and table coverage verification; PR #51 reports `git diff --check`.
- Follow-ups: Continue recording every repository or database task in a new append-only journal entry under the instructions in `docs/journal/README.md`.
