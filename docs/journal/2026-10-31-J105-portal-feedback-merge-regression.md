# J-105: Remove duplicate feedback after the portal UI merge

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `fix/portal-action-feedback`; PS-27; issues #29/#31; follow-up to merged PRs #121/#125/#126; fix PR pending
- Summary: The final merged version rendered the same success/error feedback above and below subscription details. Reproduced two success messages with real customer acceptance, then retained one shared feedback area for both workflows and clarified the source overview.
- Decisions: Adopt the team's merged journal identifiers and integration from develop 2ee0530. Do not publish the superseded local coordination commits or rewrite any published history. The shared ownership helper already has one implementation and two transaction callers. Keep the correction limited to feedback rendering.
- Database and migrations: No schema or migration changes. Reproduction and final API/browser verification used four disposable migrated/seeded databases; all were removed and development data was unchanged.
- Checks and results: Reproduced two rendered acceptance notices before the fix. Afterward, formatting, all seventy-three unit tests, all thirty-eight PostgreSQL regressions, the production client build and seventy real-customer browser checks passed (twenty-one acceptance, forty-nine lifecycle) at 375 px and 1280 px. Strict success/error locators confirm a single feedback message across both flows; pending, expiry, permissions, plan changes and closing confirmation still pass. Source diff is one overview update and removal of the duplicated two-line feedback group.
- Follow-ups: Publish the small correction PR and request Jayasurya. The original features are merged; use the current merged journal sequence rather than the withdrawn J-087 to J-094 reservation.

- Publication and integration: Opened PR #129 (https://github.com/jasilmeledath/odoo-hackathon-2026/pull/129) and requested Jayasurya. Integrated reviewed develop 1422df4, retained the add-on-aware source overview and the single feedback area, and passed seventy-seven unit tests, fifty-one PostgreSQL regressions and the production build. No new application behavior is added by the integration.
