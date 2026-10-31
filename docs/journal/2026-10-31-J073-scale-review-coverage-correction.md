# J-073: Clarify partial scale benchmark coverage

- Date: 2026-10-31
- Contributor/agent: Jayasurya with Codex
- Branch / issue / PR: `test/scale` / #44 / https://github.com/jasilmeledath/odoo-hackathon-2026/pull/114
- Summary: Addressed review feedback on the 5,000-subscription benchmark by correcting the route count, excluding placeholder pages from measured coverage, and keeping PS-25 in progress.
- Decisions: Treat the original 466720a navigation-to-accessibility-snapshot timings as preliminary. They do not establish API-ready page response times because authenticated data readiness was not awaited. Keep issue #44 open until all implemented data screens are measured with an explicit ready state.
- Database and migrations: No schema, migration or database changes. The original benchmark used an isolated disposable PostgreSQL fixture; no new benchmark data was created.
- Checks and results: Confirmed the measured revision and removed the three placeholder route timings from the implemented-page table. `git diff --check` passes and PS-25 is In progress. No application tests were run; this follow-up changes documentation only.
- Follow-ups: Rerun page measurements on current develop with a 5,000-subscription fixture; wait for a successful API response and populated or valid empty state on each authenticated route before recording its timing.
