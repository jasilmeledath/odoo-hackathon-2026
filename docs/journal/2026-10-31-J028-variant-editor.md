# J-028: Add the product variant editor

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/product-variant-editor`; issue #15; API [PR #85](https://github.com/jasilmeledath/odoo-hackathon-2026/pull/85); editor PR pending
- Summary: Added variant rows, create/edit/remove controls inside the product editor, field errors, pending feedback and exact rupee-to-paise conversion. Shared currency validation keeps product, plan and variant limits consistent.
- Decisions: Enter saves the variant without submitting its parent product. Removing a subscription-used variant displays the server conflict. Empty/loading/error states and internal table scrolling follow the shared UI.
- Database and migrations: No schema or migration changes. Temporary live verification fixtures were removed.
- Checks and results: Thirty-five live API/browser checks passed with real login at 375px and 1280px, including paise conversion, duplicate input, subscription-use and concurrent-reference deletion guards. Added currency parity regression coverage. Screenshots are included. The checkout-wide formatter gate fails on existing CRLF files; only changed source is formatted and checked. A proposed checkout normalization was declined, so Git settings and unrelated files are preserved.
- Follow-ups: Request Jayasurya review of the editor PR. Continue with quotation templates and discounts.
