# J-080: Subscription form dates, customer search and form styling

- Date: 2026-10-31
- Contributor/agent: Jasil M with Claude
- Branch / issue / PR: feat/form-ux-polish
- Summary: A new subscription now takes its expiry date from the chosen plan, the customer dropdown became a server-side search, and form controls (selects, checkboxes, textarea) share one polished style.
- Decisions: Expiry is plan start plus one billing period (daily +1 day, weekly +7 days, monthly +1 month, yearly +1 year, month ends clamp) and stays editable. The customer picker queries `GET /customers?q=` with a 250 ms pause and 20 results, so it no longer loads 50 customers into a `<select>`. Styling lives in `index.css` (global checkbox and radio rules, select chevron) so no form needed rewriting.
- Database and migrations: None.
- Checks and results: `ci:fast` 73 tests pass; client build OK; start date defaults to today (IST); picking CRM Yearly on 2026-10-31 set expiry 2027-10-31; helper checked for 31 Jan, leap day and 31 Dec. Added client limits to the subscription form: quantity 1 to 100000 whole numbers, at most 100 lines, expiry not before start. The server already enforces non-negative money, integer quantities and size caps.
- Follow-ups: Other forms only inherit the global styles; a per-screen visual pass and a client-side check of the Product, Plan and Discount forms' limits remain.
