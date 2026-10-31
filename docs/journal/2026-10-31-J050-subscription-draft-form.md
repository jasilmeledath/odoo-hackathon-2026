# J-050: Create and edit subscription drafts

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/subscription-draft-form`; issue #18; PR pending
- Summary: Added staff UI and API support to create numbered subscription drafts and edit drafts or quotations with product, variant, quantity and tax-aware lines. Pricing is computed from current database records, and recurring totals are recalculated when saving.
- Decisions: The server remains authoritative for unit prices and totals. The plan's product uses the plan price; other products use sales price; variant extra price is added. The plan must be active and available on the start date, and minimum quantity counts only the plan product. Updates use a conditional status write so a concurrent lifecycle transition cannot be overwritten. No template assignment is changed by this form.
- Database and migrations: No schema or migration change. Existing PostgreSQL tables and constraints support this workflow.
- Checks and results: `npm run ci:fast` passed formatting and all 45 server tests. `npm run build --prefix client` passed. `git diff --check` passed.
- Follow-ups: Quotation-template creation remains in issue #36, which is blocked by open issue #34.
