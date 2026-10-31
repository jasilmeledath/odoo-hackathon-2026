# J-079: Implement customer subscription lifecycle actions

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/portal-manage`; #31; PR pending; separate from acceptance PR #121
- Summary: Add own-subscription pause, resume and close APIs through the existing public subscription service. The portal controls are complete locally and ship in a separate follow-up PR to keep each review within the team's size guideline.
- Decisions: Build independently from develop 122148f, reuse existing plan/schedule/history rules and lock ownership inside the state-change transaction. The shared ownership helper and empty-body schema intentionally match PR #121 so either issue can be reviewed independently. Keep PS-27 In progress until all customer actions integrate.
- Database and migrations: No schema or migration changes. API/database and browser verification used separate disposable migrated/seeded databases; both were removed and development data was untouched.
- Checks and results: Repository-wide formatting, seventy-three unit tests, the production client build and all thirty-one PostgreSQL integration tests passed. Seven new lifecycle cases cover flags, ownership, guards, state/scheduling, duplicate requests, all three ownership-transfer races and staff compatibility. The local follow-up UI also passed forty-nine real-customer browser checks at 375 px and 1280 px, including cancelled/confirmed closing, stale plan rejection, pending controls and no page exceptions or overflow; its screenshots and controls ship in that separate UI PR.
- Follow-ups: Publish the API PR and request Jayasurya, then publish the separate verified UI PR. Only the UI completion PR closes #31; PS-27 remains In progress for other customer actions.
