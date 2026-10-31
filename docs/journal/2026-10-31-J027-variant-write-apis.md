# J-027: Add protected product-variant writes

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/product-variants`; issue #15; API PR pending
- Summary: Added Admin-only variant create/update/delete routes, parent-scoped IDs, bounded whole-paise extra prices and clear duplicate-combination errors.
- Decisions: Used subscription variants cannot be removed. The service holds a variant-row lock while checking references and deleting in one transaction because the existing nullable foreign key uses SET NULL.
- Database and migrations: No schema or migration changes. Temporary variants, subscriptions and lines are removed after verification; seeded product data is preserved.
- Checks and results: Thirty-four automated tests and the client build passed. Thirty-five live API/browser checks passed with real login/session restoration at 375px and 1280px, including a concurrent uncommitted reference that blocks deletion until it commits.
- Follow-ups: Open the API PR, then publish the separately tested product-form controls and screenshots. Auth is now integrated, so browser checks no longer stub session bootstrap.
