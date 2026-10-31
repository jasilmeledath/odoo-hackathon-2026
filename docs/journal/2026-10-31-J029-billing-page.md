# J-029: Connect the billing queue and run results

- Date: 2026-10-31
- Contributor/agent: Jasil M with Codex
- Branch / issue / PR: `feat/billing-page-completion`; issue #24
- Summary: Add a searchable paginated due queue, database-side next-period subtotal estimate, guarded Run billing action and created/skipped/failed feedback.
- Decisions: Label estimates before tax/discount and explain catch-up and whole-queue execution so filtered rows do not misrepresent what gets billed.
- Database and migrations: No schema change. All display data comes from local PostgreSQL.
- Checks and results: Production build passed. Visible Chrome at 375px and 1280px passed queue display, URL search, empty state, disabled in-flight action, real PostgreSQL invoice creation and the result link without page errors.
- Follow-ups: Review generated Draft invoices from the result link.
