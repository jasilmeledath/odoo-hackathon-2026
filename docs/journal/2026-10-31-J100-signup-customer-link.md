# J-100: Stop signup from taking over staff-made customer records

- Date: 2026-10-31
- Contributor/agent: Jasil M with Claude
- Branch / issue / PR: fix/signup-customer-link
- Summary: Registering with the email of an existing staff-made customer linked that customer to the new account, so the signer could see that customer's subscriptions and invoices in the portal.
- Decisions: Registration never links an existing customer. The account is created with no customer profile, and portal reads already refuse users without one. Staff link the record after verifying it. Full protection against revealing registered emails (generic responses and email verification) is not done in this change.
- Database and migrations: None.
- Checks and results: New integration test `signupCustomerLink.integration.test.js` registers with a seeded customer email and checks that no link is made and portal reads fail. `npm run ci:local` passes 77 tests and the client build.
- Follow-ups: Signup still returns 409 for an existing account email, which reveals whether an email is registered. Fixing that needs email verification and a generic response.
