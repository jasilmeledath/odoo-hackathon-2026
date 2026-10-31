# J-107: Start a subscription from a quotation template

- Date: 2026-10-31
- Contributor/agent: Jayasurya with Codex
- Branch / issue / PR: `feat/subscription-from-template`; issue #36; PR pending
- Summary: Added active quotation template search and application to new subscription drafts. The template's plan and lines prefill the form and remain editable; the selected template is saved and used when calculating quotation validity. Added server-side active filtering for template lists and documented the API and requirement status.
- Decisions: The submitted plan must match the selected active template. The server continues pricing every line from current catalog values. Editing an existing subscription without a `templateId` retains its current association.
- Database and migrations: No schema, migration or database changes; existing subscription template relation and quotation expiry fields are used.
- Checks and results: `npm run ci:fast` passed (format check and 78 server tests); `npm --prefix client run build` passed. `git diff --check` passed.
- Follow-ups: Open a PR to `develop` and update this entry with its link and final check results.
