# J-016: Fix subscription-detail review findings

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/subscription-detail`; PR #60
- Summary: Format activity timestamps in IST, link invoice numbers from the subscription detail page to invoice detail routes, and move display sections out of the route page.
- Decisions: Use the existing date-time formatter with an explicit `Asia/Kolkata` timezone. Use the invoice ID already returned by the detail API for navigation. Keep the page component focused on loading, not-found and section composition so it stays under the page-size guideline.
- Database and migrations: No schema, migration, or database data changes.
- Checks and results: `npm --prefix client run build` and `git diff --check` passed. Server/database and browser viewport checks were not run in this environment.
- Follow-ups: Request re-review; invoice navigation depends on the invoice-detail route in PR #56.
