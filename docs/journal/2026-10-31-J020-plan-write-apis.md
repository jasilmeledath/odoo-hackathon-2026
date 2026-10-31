# J-020: Add plan write APIs and integrate current develop

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/plans`; issue #16; PR pending
- Summary: Added Admin-only plan creation and updates, bounded whole-paise prices and quantities, calendar-date validation, all four billing periods, behaviour switches, friendly duplicate-name/product-reference errors, and related product display data. Integrated the current develop branch and preserved its product and tax work.
- Decisions: Sale boundaries are inclusive; a missing end date remains open-ended. Product metadata is loaded with plans rather than fetched once per row. API, form and list changes are reviewed in separate small PRs.
- Database and migrations: No plan schema change or new migration. Apply the existing upstream dashboard-notification migration to the local development database. Temporary plan test records are removed after verification.
- Checks and results: The initial plan API/browser integration passed 35 checks at 375px and 1280px, including four billing periods, all switches, reversed dates, permissions, exact paise storage and deactivation. Initial automated suite passed 28 tests; rerun the combined suite and build after upstream integration.
- Follow-ups: Open the API PR, then restore and publish the separately tested form and list work. Full login bootstrap remains dependent on the auth module; browser checks stub only auth/me while catalog calls use the real API/database.
