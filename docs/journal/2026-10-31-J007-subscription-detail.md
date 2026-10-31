# J-007: Add subscription detail and activity history

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/subscription-detail`; issue #19; PR pending
- Summary: Added staff-only detail and activity endpoints plus a responsive subscription detail page with customer, plan, terms, lines, invoice summaries, a status bar, and a chronological timeline.
- Decisions: The timeline is oldest-first and includes the actor's display name; scheduler entries without an actor are rendered as System. Detail queries select only fields needed by the page.
- Database and migrations: No schema, migration, or database data changes. The existing subscription, invoice and activity-log relations and indexes are used.
- Checks and results: Reviewed role guards, ID validation, not-found behavior, relation selections, timeline ordering and mobile table overflow. Runtime tests and browser viewport checks were not run in this task turn.
- Follow-ups: Add status-transition controls and enforce their business rules in issue #20.
