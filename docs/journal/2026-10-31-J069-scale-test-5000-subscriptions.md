# J-069: Scale test with 5,000 subscriptions

- Date: 2026-10-31
- Contributor/agent: Jayasurya with Codex
- Branch / issue / PR: `test/scale` / #44 / https://github.com/jasilmeledath/odoo-hackathon-2026/pull/114
- Summary: Seeded an isolated local PostgreSQL database with 5,000 subscriptions, measured all application route pages, and ran billing against a due queue of 4,000 active subscriptions.
- Decisions: Measure browser navigation through a rendered accessibility snapshot and report that assets were warm and the result is local development timing. The API startup scheduler caught up some seeded due periods before route measurements; the benchmark report records the resulting counts. Prepare due work by updating only the disposable fixture's `next_invoice_date` values; do not change application data or schema.
- Database and migrations: No schema or migration changes. Applied the four existing migrations. The raw seed produced 5,000 subscriptions, 20,004 invoices, 26,646 invoice lines, and 14,686 payments. Before page measurements, startup scheduling brought the database to 22,654 invoices and 30,204 invoice lines. After the explicit run, 3,169 invoices were created; 831 periods were skipped because a non-canceled invoice already existed; no billing failures occurred.
- Checks and results: All 26 public, staff, and customer page routes loaded in 113–201 ms in Chrome. The API request log recorded the 4,000-subscription billing run at 9,816 ms. Formatting, server tests, and production build were not part of this performance-only task.
- Follow-ups: Timings and exact route values recorded in `docs/data-model.md`; share the result in issue #44. Repeat with cold browser cache and representative production hardware before treating local timings as a capacity guarantee.
