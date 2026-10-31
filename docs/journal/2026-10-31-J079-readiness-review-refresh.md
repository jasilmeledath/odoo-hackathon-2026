# J-079: Refresh readiness after review

- Date: 2026-10-31
- Contributor/agent: Jasil M with Codex
- Branch / issue / PR: docs/readiness-check; PR #107
- Summary: Resolve develop integration conflicts and refresh obsolete readiness claims requested by Jayasurya.
- Decisions: Preserve upstream requirement statuses; mark completed invoice workflow Done. J-068 remains historical evidence for 6c57fe2, not measurements of this updated branch.
- Database and migrations: No schema changes. Local gate applies existing migrations to a disposable PostgreSQL database.
- Checks and results: Current source inventory has 69 HTTP handlers and 29 explicit client paths (including aliases); all current handlers remain documented. Subscription CRUD/lifecycle, discount UI, portal reads and attempt limits are now implemented. The earlier 21-screen/59-handler counts describe the earlier snapshot only. Routes and handlers are unchanged between develop 9727582 and 122148f (later merges #112, #114, #116 and the main sync touched polish, documentation and a draft default only), so these counts hold on 122148f.
- Follow-ups: Remaining demo dependencies are template-to-quotation #36 and portal actions #29/#31/#32; final documentation #111 remains open. PR #114 is merged, but its scale report is partial: PS-25 stays In progress and issue #44 stays open until all implemented data screens are re-measured with an explicit ready state. Reviewer should re-review #107 after synchronization.
