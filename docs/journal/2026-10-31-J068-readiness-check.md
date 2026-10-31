# J-068: Verify current readiness and prepare the next promotion

- Date: 2026-10-31
- Contributor/agent: Jasil M with Codex
- Branch / issue / PR: `docs/readiness-check`; PR pending; refs #28, #44, #45, #46, #47, #48, #49
- Summary: Audit the latest reviewed develop, verify independent readiness checks, and incorporate main's promotion merge so the next normal promotion can proceed after this PR merges.
- Decisions: Preserve contributor commits and branch direction. Do not implement teammates' unfinished dependencies, mark planned endpoints complete, backfill missed hourly checkpoints, close partially completed issues, or claim a video was recorded/submitted. The full story remains blocked. This entry supersedes older dependency lists in issue comments, not the original journal evidence.
- Database and migrations: No schema or migration changes. A genuinely fresh remote clone used fresh dependency installs, all four existing migrations, Prisma generation and a disposable local PostgreSQL database. Seeded 5,000 subscriptions, 20,004 invoices, 26,646 invoice lines and 14,686 payments. All mutations below are isolated review data.
- Checks and results: Fresh server/client/root installs reported zero dependency vulnerabilities; server startup, health and production build passed. The final local gate passed formatting, fresh migrations, 57 unit tests and the client build; all 17 PostgreSQL integration regressions also passed on the fresh scale database. The API audit found 59 implemented endpoints, all documented and ticked, with 15 correctly unticked planned subscription/portal endpoints. All 19 mapped tables and ten enum mappings are referenced by the model document. No tracked .env/private-key files were found. Corrected stale password-version documentation, discount filter labels and implemented requirement statuses.
- Follow-ups: This is evidence for available functionality, not completion of blocked final checkpoints. Merge this PR, then run `npm run promote:main` on clean synchronized develop to refresh main. Re-run full-story and remaining-page checks when their owners deliver dependencies.

## Scale verification

Source: develop `6c57fe2`; Node v26.0.0, local PostgreSQL, Chrome, production Vite preview. No CPU/network throttling. Page measurements include document navigation, auth bootstrap and visible loading completion; three navigations per screen/viewport, worst sample below. These are local readiness observations, not an under-load or remote-network guarantee.

The scheduled activation/closure/billing pass took **8135 ms**, activated **250** subscriptions, created **2,650** Draft invoices and reported **zero failures**. Invoice count became **22,654**. A repeat billing pass took **1 ms**, created **zero** invoices and reported zero failures. The two-second target applies to interactive pages; bulk processing is reported separately.

**21 implemented screens**, **126 full navigations**, all below 2,000 ms, no page exceptions or horizontal overflow. Discount and portal placeholders, and absent subscription form/lifecycle workflows, are deliberately excluded: issue #44 remains open.

| Screen | Worst at 375px (ms) | Worst at 1280px (ms) |
|---|---:|---:|
| `/` | 128 | 58 |
| `/customers` | 35 | 32 |
| `/customers/new` | 32 | 17 |
| `/customers/:id` | 26 | 35 |
| `/customers/:id/edit` | 36 | 26 |
| `/subscriptions` | 42 | 107 |
| `/subscriptions/:id` | 43 | 43 |
| `/billing` | 25 | 25 |
| `/invoices` | 55 | 55 |
| `/invoices/:id` | 34 | 36 |
| `/payments` | 35 | 31 |
| `/products` | 44 | 33 |
| `/plans` | 45 | 25 |
| `/taxes` | 42 | 35 |
| `/templates` | 33 | 35 |
| `/staff` | 35 | 26 |
| `/reports` | 56 | 59 |
| `/login` | 19 | 25 |
| `/signup` | 20 | 14 |
| `/forgot-password` | 16 | 13 |
| `/reset-password` | 17 | 14 |

**96 live API checks** passed. Twenty-three read endpoints each had three measured requests; the slowest request was `/reports/revenue` at **20 ms**. Confirmed real logins for all three roles, customer denial on six staff APIs, partial/final payment balances, Paid status, cancellation rejection after payment, exact revenue increments, and a committed-payment SSE notification. This does not prove customer ownership isolation: portal APIs are still absent.

## Remaining dependency order

| Jasil issue | Progress/evidence | Required before completion |
|---|---|---|
| #28 first full-story checkpoint | Signup, staff/customer roles, catalog, seeded billing/payment/report flows verified | Jayasurya #18 and #36; Yadhu #11 and #29, then full customer journey and main promotion |
| #44 all-page scale check | Available pages and large billing verified above | Missing subscription form/workflows, discount UI #35 and portal #11/#29–#32, then measure those screens |
| #45 full-story quality checkpoint | Existing tests, API guards, database/billing/payment and responsive checks pass | Full story, customer isolation #12, remaining polish, explicit cut-if-late decisions and main promotion |
| #46 shared polish | Jasil's billing/invoice work was already checked; current responsive evidence retained | Other owners' unfinished pages and branch cleanup; do not tick their sign-offs |
| #47 hourly promotion | PR #103 merged develop `df63d71` at 14:02:43 IST; current PR incorporates that main merge | Merge this reviewed ancestry update, run normal promotion gate, then future hourly/final checkpoints |
| #48 final documentation | Fresh setup works; current API/model inventory and requirement statuses audited | Finish the 15 planned endpoints, remaining UI/screenshots and final documentation sign-off |
| #49 video | Time-coded narration added to implementation plan | Full story and recording/submission destination; no completed video exists |

## Quality evidence and open exceptions

- Database/logic: existing real-PostgreSQL regression suites cover transactional billing, snapshots, cancellation/refunds, discount limits, cursor/idempotence and precise session versions. Large billing above adds runtime evidence.
- Standards/modularity: pinned formatting gate, feature modules and shared helpers are retained. This PR changes no application behavior or dependencies.
- Security: roles and session invalidation are implemented. Customer record isolation awaits #12/#11; rate limiting #33 is still pending. No new credentials are committed.
- Frontend/performance/usability: measured available screens at both widths, with prior invalid-input, empty-state and retry checks recorded in J-067. Unimplemented screens are listed above.
- Debugging/live data: request logs remain enabled, payment writes update balances and emit a committed SSE event. Audit/history service regressions remain in the test suite.
- Cut-if-late: #32 add-ons and #33 attempt limiting are still assigned to Yadhu. Their owner/lead must record a retain/drop decision at the checkpoint; this audit does not silently drop them.
