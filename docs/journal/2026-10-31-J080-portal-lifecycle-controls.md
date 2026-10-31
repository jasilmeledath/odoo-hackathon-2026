# J-080: Add the verified customer lifecycle controls

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/portal-manage-ui`; #31; UI PR pending; depends on [API PR #125](https://github.com/jasilmeledath/odoo-hackathon-2026/pull/125)
- Summary: Add conditional customer pause/resume/close controls with closing confirmation, disabled pending actions and persistent success/error feedback. Publish the UI separately from the security/API changes to meet the review-size guideline.
- Decisions: Use the plan flags returned by the API only for visibility; the server remains authoritative. Cancelled closing sends no request. The separate acceptance PR #121 and add-on work remain independent; PS-27 stays In progress. This branch starts from the verified API commit bf36663.
- Database and migrations: No schema or migration changes. Browser verification used a disposable migrated/seeded database which was removed; development data was untouched.
- Checks and results: Forty-nine real-customer browser checks passed through real APIs at 375 px and 1280 px, covering pause/resume, persisted status, close cancellation/confirmation, disabled pending controls, forbidden and changed plan flags, foreign records, financial/cursor preservation and no page errors/overflow. Captured and visually inspected both screenshots. Production build, formatting and seventy-three unit tests passed; the parent API passed thirty-one database regressions including all three ownership-transfer races.
- Follow-ups: Publish the UI PR into develop; its bounded UI review follows API PR #125. Only the completion PR closes #31. Keep the shared journal history append-only.
