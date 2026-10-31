# J-052: Add discount field and product controls

- Date: 2026-10-31
- Contributor/agent: Manoj PN with Codex
- Branch / issue / PR: `feat/discount-fields`; issue #35; APIs #101/#104; shared catalog #97/#98
- Summary: Added client validation, shared rupee checks, bounded discount fields and deduplicated paginated product selection.
- Decisions: Show product controls only for PRODUCT scope. Keep limits/messages aligned with the API and preserve read-only usage. J-051 integration passed fifty tests and the build; its rejected unlisted git commit scope was corrected to repo without bypassing hooks.
- Database and migrations: No schema or migration changes. Scoped browser fixtures were removed.
- Checks and results: Fifty-one automated tests, client build and thirty real-login browser checks passed at 375px and 1280px with the pending form/list, including currency, type/scope changes, usage preservation, pending controls, date/limit errors and persisted state filters.
- Follow-ups: Publish the form and list separately, then synchronize feature branches and complete #46 checks. The existing global CRLF gate limitation remains; changed source is formatted.
