# J-037: Add the quotation-template form

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/template-form`; issue #34; API #97; fields #98
- Summary: Added template creation/editing with plan selection, editable product/variant/quantity rows, validity, notes and active state.
- Decisions: Send only input references and quantities. Keep displayed prices read-only; require confirmation for deactivation and disable pending actions.
- Database and migrations: No schema or migration changes. Verification fixtures were removed.
- Checks and results: Thirty-five automated tests, the client build and twenty-two real-login browser checks passed with the pending list integration at 375px and 1280px. Covered invalid validity, line rows, preserved selection, prices, create/update and dismissed/accepted deactivation.
- Follow-ups: Publish this form PR and the separate final list/preview PR. Formatting is checked on changed source; the existing global CRLF gate limitation is unchanged.
