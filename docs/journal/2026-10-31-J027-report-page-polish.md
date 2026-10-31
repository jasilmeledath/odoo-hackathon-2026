# J-027: Improve report-page accessibility and recovery

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `fix/report-page-polish`; issue #46; PR pending
- Summary: Added retry actions for report summary, renewals and revenue-chart errors; associated date-filter labels and range feedback with their inputs; improved keyboard focus targets and renewal table headers; added a screen-reader table alternative for monthly chart data and corrected heading hierarchy.
- Decisions: Keep the existing CSS chart and API contracts. Reuse `useApi` reload callbacks and extend the shared `Field` component with optional input and error IDs.
- Database and migrations: No application schema or migration changes. A disposable local PostgreSQL database was migrated and seeded for QA, then stopped and removed.
- Checks and results: `npm --prefix client run build`, `npm run check:format`, and `git diff --check` passed. A server process could not be kept reachable in this environment, so interactive browser checks at 375px and 1280px and bad-range submission remain pending.
- Follow-ups: Finish the viewport and date-range interaction checks, then update issue #46. No dependent tasks were started.
