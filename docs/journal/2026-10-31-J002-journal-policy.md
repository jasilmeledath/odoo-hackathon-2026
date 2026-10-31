# J-002: Require a shared work journal

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `docs/work-journal-policy`; PR pending
- Summary: Added the append-only journal instructions and baseline entry. Made journal review and same-PR recording mandatory in the engineering standards, `AGENTS.md`, and `CLAUDE.md`; linked the journal from the documentation index.
- Decisions: Every task that changes code, docs, configuration, or the database receives a numbered entry. Contributors read the journal instructions, five newest entries, and task-related history before starting.
- Database and migrations: No schema, migration, or database data changes.
- Checks and results: Documentation links and diffs checked; no runtime tests apply to this documentation and instruction change.
- Follow-ups: Add the PR link after opening it. All future codebase and database work must include a journal entry in its PR.
