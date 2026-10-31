# J-098: Coordinate role-checks journal records

- Date: 2026-10-31
- Contributor/agent: Jayasurya with Codex
- Branch / issue / PR: `fix/role-checks-review`; PR #123
- Summary: Resolve collisions by assigning unique journal IDs J-090, J-091 and J-092 to the role-regression, publication and review-correction entries.
- Decisions: Preserve entry content and original PR links while updating each filename and heading together. Coordinate the related portal add-on entries as J-087 through J-089.
- Database and migrations: No schema, migration or database changes.
- Checks and results: Whitespace and formatting checks passed; all 73 server unit tests passed. No application source changed in this documentation-only correction.
- Follow-ups: Merge after the portal API/UI changes are integrated and all review findings are cleared.
