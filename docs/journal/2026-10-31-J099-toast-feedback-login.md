# J-099: Toast feedback system and login redesign

- Date: 2026-10-31
- Contributor/agent: Jasil M with Claude
- Branch / issue / PR: feat/toast-feedback
- Summary: Every user action now gets a toast, and the login page is redesigned with a show/hide password toggle.
- Decisions: Toasts come from one provider (`components/ToastProvider.jsx`, hook in `lib/toast.js`) mounted at the app root. Success and info toasts last four seconds and errors six. A canceled confirmation dialog stays silent. Field-level validation errors stay inline under their inputs; general server errors show as a toast and also stay inline for screen-reader users. Session expiry shows a toast only when a token was present, so a failed login does not claim the session ended.
- Database and migrations: None.
- Checks and results: `ci:fast` 73 tests pass; client build OK. In the browser: logout shows "You have been logged out."; a wrong password shows the error toast; the eye button shows and hides the password; a correct login shows "Welcome back, <name>."
- Coverage: Login, logout, sign-up, forgot and reset password, customer, staff, payment, product, product variant, plan, discount, template, tax and payment term saves; invoice confirm, cancel, send and bulk confirm; billing run; subscription create, update and lifecycle actions; invoice date-range filter errors; validation failures on each form.
- Follow-ups: The subscription form change conflicts with PR #124 in `SubscriptionForm.jsx`, so whichever merges second needs a small rebase. Subscription lifecycle messages still say "status updated" for pause and resume; per-action wording is a later polish.
