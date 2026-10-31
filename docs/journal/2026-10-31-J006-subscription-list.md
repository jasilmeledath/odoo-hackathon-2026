# J-006: Add the staff subscription list

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/subscription-list`; issue #17; PR pending
- Summary: Added a staff-only, paginated subscription list API with status, customer, plan and text-search filters. Added a responsive list page whose search and status filters persist in the URL, with loading, error and empty states.
- Decisions: Search matches subscription number, customer name/company and plan name. Filters combine with AND and use the existing shared pagination helper. No new dependencies or database fields are needed.
- Database and migrations: No schema, migration, or database data changes. Existing foreign keys and indexes support the list relationships and filter fields.
- Checks and results: Reviewed route guards, Zod query validation, Prisma selections, URL filter handling, and API documentation against the issue acceptance criteria. Runtime tests and UI checks were not run in this task turn.
- Follow-ups: Implement subscription creation/editing, detail/history, and lifecycle actions in their own issues and pull requests.
