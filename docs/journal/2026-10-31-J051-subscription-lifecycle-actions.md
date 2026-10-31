# J-051: Subscription lifecycle actions

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `feat/subscription-lifecycle-controls`; issue #30; PR pending
- Summary: Added staff API actions and detail-page controls to pause, resume, renew and close subscriptions early. Each action checks the plan's policy flags, updates the same subscription transactionally, and records its activity.
- Decisions: Paused subscriptions retain their scheduled invoice cursor and are excluded from billing by the existing Active-only billing query. Resume advances the cursor along the original billing period to the first boundary on or after today, preserving the subscription start-day anchor. Renewal extends the same Active subscription, validates a later expiry, and restores a future invoice cursor from its last non-canceled invoice if billing had stopped at expiry. Early close clears future billing and records `CLOSED_EARLY`.
- Database and migrations: No schema or migration change. Existing status, invoice cursor, close reason and activity action columns support these transitions.
- Checks and results: `npm run ci:fast` passed formatting and all 62 server tests. `npm run build --prefix client` passed. `git diff --check` passed.
- Follow-ups: None. Issue #30 depends on #20, which is closed.
