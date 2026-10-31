# J-035: Add quotation-template APIs

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/quotation-templates`; issue #34; API PR pending
- Summary: Added paginated template reads, current-price details and protected create/update routes with transactional line replacement, bounded inputs and batched reference checks.
- Decisions: PS-11 and A-5 prices are calculated from the current plan, product and variant and are never stored. Variant choices must belong to their line product. Admin writes and Internal reads follow A-7.
- Database and migrations: No schema or migration changes. Verification creates and removes isolated temporary catalog fixtures without resetting demo data.
- Checks and results: Thirty-four automated tests, production client build and thirty-six live API checks passed. Checks include role denial, current prices after catalog changes, no stored price columns, rollback after a conflicting update, invalid inputs/references and pagination. An initial request interrupted by a backend restart was rerun after health passed.
- Follow-ups: Open the API PR and build the editor/list in separate small PRs. Variant API PR #85 and editor draft #96 are published; mark plan-list PR #77 ready now its API/form dependencies have merged. Changed source passes pinned formatting; the global CRLF checkout limitation remains.
