# J-053: Add the discount form

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/discount-form`; issue #35; depends on discount APIs and field controls
- Summary: Added Admin rule creation/editing with type/scope switches, minimums, date range, optional usage limit and deactivation confirmation.
- Decisions: Convert rupees only at the API edge; never submit usageCount. Scope changes clear irrelevant product links. Disable the full fieldset during requests.
- Database and migrations: No schema or migration changes; temporary verification fixtures removed.
- Checks and results: Fifty-one automated tests, production build and thirty real-login browser checks passed with the pending list integration at 375px and 1280px. Checked field errors, whole paise, scope, pending actions, usage guards and accepted/dismissed deactivation.
- Follow-ups: Publish the final list, synchronize branches and complete the catalog/template/discount polish. Existing global CRLF formatting limitations remain documented.
