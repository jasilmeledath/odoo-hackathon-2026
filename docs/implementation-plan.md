# Implementation Plan

| Field | Value |
|---|---|
| Version | 1.0 |
| Owner | Team lead (Jasil M) |
| Last updated | 31 October 2026 |
| Related documents | [Requirements](requirements.md) · [Data Model](data-model.md) · [API Reference](api.md) · [Engineering Standards](engineering-standards.md) · [CONTRIBUTING](../CONTRIBUTING.md) |

**Goal:** build one system that runs Brightloop's whole subscription month, from signing up a customer to the finance lead's numbers, working end to end by 4:30 PM.

**Approach:** the database design and shared scaffold are ready. Each member owns complete modules, so everyone commits in their own folders. Seed data means nobody waits for a teammate's feature to have data to work with.

## 1. What is already in place

| Area | Ready |
|---|---|
| Database | PostgreSQL schema with 19 tables, 10 enums, 33 check constraints and the double-billing guard. See [Data Model](data-model.md) |
| Seed data | Every role and status, and up to thousands of subscriptions with `SEED_SUBSCRIPTIONS` |
| Server | Express app with every module's router mounted, plus auth guards, validation, error handling and request logging |
| Shared helpers | `dates.js`, `money.js`, `numbering.js`, `activity.js`, `pagination.js`, `validation.js`, `mail.js` |
| Client | Vite, React, Tailwind, theme, role-based menu, route table, API client, auth context, `useApi`, shared UI components, and a stub page for every module |

Business features are deliberately **not** built. They belong to their owners, so each person's commits show their own work.

## 2. Start here

Do these once, after the project setup is merged into `develop`:

1. Clone the repo, run `git switch develop`, and run the setup in [CONTRIBUTING §7](../CONTRIBUTING.md#7-one-time-setup).
2. Set up the database and server using [Data Model §10](data-model.md#10-setup-and-day-to-day-use).
3. In `client/`, run `npm install`.
4. Run `npm run dev` in `server/` and in `client/`, in two terminals.
5. Open `http://localhost:5173`. The login page is a stub until PS-2 lands, so check `http://localhost:4000/api/health` as well.
6. Read your section in [§4](#4-work-by-owner).

## 3. Timeline

| Time | Everyone is working on |
|---|---|
| Until 10:00 AM | **Lead:** submit the repo link and add the evaluator. **Everyone:** setup, then start P1 |
| 10:00 AM – 12:30 PM | All P1 requirements: the core flow working on real data |
| **12:30 PM** | **Checkpoint 1:** everyone pulls `develop`, and the lead runs [the demo story](#8-demo-story) from sign-up to dashboard |
| 12:30 – 1:00 PM | Fix what the checkpoint found |
| 1:00 – 3:30 PM | All P2 requirements |
| **3:30 PM** | **Checkpoint 2:** the full demo story, then the scale test ([§7](#7-quality-checks-against-odoos-criteria)) |
| 3:30 – 4:30 PM | Polish: validation gaps, empty states, 375 px checks, consistent spacing |
| **4:30 PM** | **Feature freeze.** All feature branches merged and deleted. Bug fixes only |
| 4:45 PM | Final documentation check, including a fresh clone |
| **5:00 PM** | Coding ends. Final pull request from `develop` to `main` merged |
| By **5:30 PM** | Lead records and submits the 5–6 minute demo |

**Everyone pushes at least once every hour** to their feature branch, and merges into `develop` through a pull request. Set a 50-minute timer. The lead opens a pull request from `develop` to `main` at each hourly checkpoint.

## 4. Work by owner

Tasks are in build order. Module folders are `server/src/modules/<module>/` and `client/src/pages/<module>/`. In each module, `<module>.routes.js` handles HTTP, `<module>.service.js` holds logic and queries, and `<module>.schemas.js` holds Zod schemas.

### Yadhu: access, customers, payments and portal

**First priority: `POST /auth/login` by 10:15 AM.** Everyone needs it to test protected routes, and seeded users already exist.

| # | Task | Refs | Notes |
|---|---|---|---|
| 1 | Login API and page | PS-2 | Return `{ token, user }`. `signToken` stores the user id and a precise signed password version (never the role): `requireAuth` reads the role and `customerId` from the database on every request. Refuse inactive users |
| 2 | Sign-up API and page | PS-1, PS-5 | Password rule below. In one transaction, create the user and customer, or link an existing customer with that email. Never read `role` from the body |
| 3 | Forgot and reset password | PS-3 | A-2. Generate 32 random bytes with `crypto`, and store the SHA-256 hash in `password_reset_tokens`. Set `passwordChangedAt` on reset, which ends older sessions |
| 4 | Customers list, form and detail | PS-12 | |
| 5 | Staff list and form, Admin only | PS-5 | |
| 6 | Payments API and page, and record payment from an invoice | PS-21, PS-22 | Rules below |
| 7 | Portal: subscriptions and invoices | PS-26 | Every query filters by `req.user.customerId` |
| 8 | Portal: accept, add-ons, pause, resume, close | PS-27 | Reuse the subscriptions service. Do not copy its rules |
| 9 | Limit repeated attempts on login and reset | PS-29 | A small in-memory limiter in `middleware/`, with no new dependency |

**Password rule (PS-1, A-1), the same on client and server:** at least 9 characters, with an uppercase letter, a lowercase letter and a special character. Show one message for each rule that fails.

**Recording a payment (PS-21).** In one transaction: allow it only on a `CONFIRMED` invoice, reject an amount above the balance, insert the payment, increment `paidAmount`, set `PAID` and `paidAt` when the balance reaches zero, and log `PAYMENT_RECORDED`.

### Manoj: catalog, discounts and templates

| # | Task | Refs | Notes |
|---|---|---|---|
| 1 | Taxes and payment terms: API and page | PS-10, PS-12 | Do these first: the smallest module sets the CRUD pattern |
| 2 | Products: API, list and form | PS-6 | Enter rupees, store paise (`toPaise`, `formatMoney`). Show margin (sales minus cost) |
| 3 | Product variants inside the product form | PS-7 | The unique rule is product + attribute + value |
| 4 | Plans: API, list and form | PS-8, PS-9 | End date on or after start date. Use plain words for the four switches |
| 5 | Read routes used by others by **10:45 AM** | | `GET /plans`, `/products`, `/taxes` and `/payment-terms`. Jayasurya's forms need these |
| 6 | Quotation templates with lines | PS-11 | Show current prices. Do not store them |
| 7 | Discount rules with product picker | PS-19 | Fixed or percent, never both. Show each rule's state (Active, Expired, Used up) |

### Jayasurya: subscriptions, dashboard and reports

| # | Task | Refs | Notes |
|---|---|---|---|
| 1 | Subscription list with status filter and search | PS-12, PS-13 | The filter lives in the URL, so it survives a refresh |
| 2 | Create and edit a draft with lines | PS-12 | Pricing rule below. Plan must be available on the start date. Minimum quantity applies to the plan's product line |
| 3 | Subscription detail with status bar and timeline | PS-13 | Show the steps Draft → Closed, with only the allowed actions as buttons |
| 4 | Status changes: quote, confirm, activate | PS-13 | One `assertTransition()` function holds the allowed moves. See [Data Model §6](data-model.md#6-lifecycles) |
| 5 | Start from a quotation template | PS-11 | Fills in the plan and lines. Sets the quotation expiry |
| 6 | Pause, resume, renew, close early | PS-14 | Check the plan's rules on the server |
| 7 | Dashboard: summary cards and overdue list | PS-23 | Use `SUM` in the database. Cards link to filtered lists |
| 8 | Reports: filters, revenue by month, renewals | PS-24 | A simple CSS bar chart, with no chart library |
| 9 | Live dashboard through Server-Sent Events | PS-28 | Send a "changed" signal after a payment or invoice change. The dashboard then reloads its data |

**Pricing a line (A-5).** Unit price = (plan price if the line is the plan's product, otherwise the product's sales price) + the variant's extra price. Amount = quantity × unit price. Whenever lines change, recalculate `recurringAmount` and `monthlyRecurringAmount` with `toMonthlyAmount`.

### Jasil: billing, invoices and integration

| # | Task | Refs | Notes |
|---|---|---|---|
| 1 | `calculateInvoice()`, a pure function in `billing.service.js` | PS-16, PS-20 | [§5](#5-how-billing-works) |
| 2 | Automated tests for `calculateInvoice()` | PS-16 | `node --test`, including the worked example in §5 |
| 3 | `billSubscription()` and the billing run | PS-15 | [§5](#5-how-billing-works) |
| 4 | Billing page: what is due, Run billing, the result | PS-15 | |
| 5 | Invoice list with paid, outstanding and overdue filters | PS-17, PS-22 | |
| 6 | Invoice detail, confirm, bulk confirm, cancel | PS-17 | Canceling gives back the discount use and moves `nextInvoiceDate` back if needed |
| 7 | Print view and send | PS-18 | `window.print()` with the `no-print` class, and `sendMail()` |
| 8 | Scheduler | PS-14, PS-15 | `lib/scheduler.js` runs at start-up and hourly: activate on the start date, close at expiry, then bill |
| 9 | Run the checkpoints, keep `develop` and `main` healthy, promote `develop` to `main` every hour, record the demo | | |

## 5. How billing works

This is the core of the system, and the place where a mistake costs real money.

**`billSubscription(tx, subscription, issueDate)`**, in one database transaction per period:

1. Take the period from `nextInvoiceDate`. The period ends the day before `addPeriod(nextInvoiceDate, billingPeriod, startDay)`, where `startDay` is the day of the month of `startDate`.
2. Skip it if the period would start on or after `expiryDate` (A-9).
3. Read the active lines, and find the matching discounts.
4. Calculate with `calculateInvoice()`.
5. If a discount applies, increment its `usageCount` with a conditional `updateMany` (`usageCount < usageLimit`). If no row changes, someone else took the last use, so calculate again without it.
6. Create the invoice and lines as `DRAFT`, with the number from `nextNumber(tx, 'INVOICE')`.
7. Advance `nextInvoiceDate`, and log `INVOICED`.

**The billing run** reads due subscriptions in batches of 100, ordered by `id`, and bills each in its own transaction. A failure on one subscription is counted and logged, and the run carries on. A subscription behind by several periods gets one invoice for each, oldest first, so nothing is skipped. A `P2002` from `invoices_one_per_period_key` means that period is already billed, so it counts as skipped and is not an error.

**`calculateInvoice({ lines, discounts })`** takes plain data and returns the totals and lines. It never touches the database, so it can be tested on its own. The steps, in this order:

1. **Amounts:** each line is quantity × unit price. Subtotal is their sum.
2. **Discount eligibility:** a discount is eligible if it is active, the issue date is within its dates, and it has uses left. Its eligible lines are all lines for `SUBSCRIPTION` scope, or the listed products' lines for `PRODUCT` scope. Their total amount must reach `minPurchaseAmount`, and their total quantity must reach `minQuantity`.
3. **Pick one:** work out the saving for each eligible discount, capped at the eligible amount, and keep the largest (A-11).
4. **Share it out:** split the saving across eligible lines in proportion to their amounts, and give the rounding remainder to the last line, so the shares add up exactly.
5. **Tax:** for each line, `applyPercent(amount - discountAmount, ratePercent)`.
6. **Total:** subtotal − discount + tax.

**Worked example** (use this as the first test). CRM Monthly on the Odoo brand, 10 seats, with one Extra Storage add-on, and the Bulk seats 10% discount:

| Line | Quantity | Unit price | Amount | Discount share | Taxable | GST 18% |
|---|---|---|---|---|---|---|
| Brightloop CRM (Odoo) | 10 | ₹1,760.00 (₹1,200 + ₹560) | ₹17,600.00 | ₹1,760.00 | ₹15,840.00 | ₹2,851.20 |
| Extra Storage | 1 | ₹200.00 | ₹200.00 | ₹20.00 | ₹180.00 | ₹32.40 |
| **Total** | | | **₹17,800.00** | **₹1,780.00** | | **₹2,883.60** |

**Invoice total: ₹17,800.00 − ₹1,780.00 + ₹2,883.60 = ₹18,903.60**

## 6. Dependencies and how to avoid waiting

| You need | From | Until it lands |
|---|---|---|
| A login token | Yadhu, by 10:15 AM | Sign a test token in the Node console with `signToken`, or query through your service directly |
| Dropdown data for forms | Manoj, by 10:45 AM | Prisma reads inside your own module work straight away, because the seed has the data |
| Invoices to work with | Jasil | The seed has 198 invoices in every state |
| Subscriptions due for billing | Jayasurya | The seed leaves a quarter of running subscriptions due today |
| A schema change | Jasil | Say so on the team chat first. One person changes `schema.prisma` at a time |

## 7. Quality checks against Odoo's criteria

Each row is checked at both checkpoints.

| Odoo criterion | What we check |
|---|---|
| **Database design** (most important) | Every rule in [Data Model §7](data-model.md#7-how-the-hard-rules-are-guaranteed) holds, and the document matches the schema |
| **Coding standards** | Names follow [Naming Conventions](naming-conventions.md), and Prettier has been run |
| **Logic** | The worked example passes. Status changes outside the allowed moves return `409`. Nothing bills twice |
| **Modularity** | Routes hold no business logic. Rules exist in one service, and the portal reuses them |
| **Frontend design** | One theme, shared components, consistent spacing |
| **Performance** | `SEED_SUBSCRIPTIONS=5000 npm run db:seed`, then every page loads in under two seconds |
| **Scalability** | Lists are paginated, totals use `SUM`, and billing runs in batches |
| **Security** | A customer opening another customer's invoice gets `404`. A customer calling a staff route gets `403`. No secrets in git |
| **Usability** | Every error says how to fix it. Every action gives feedback. Lists have loading, error and empty states |
| **Debugging** | The server logs one line per request, and the timeline shows who changed what |

## 8. Demo story

This is the path for both checkpoints and the 5–6 minute video, told as one month at Brightloop.

1. **Sign-up:** a new customer signs up. Show the password errors first.
2. **Roles:** log in as staff, then show that the customer sees only their portal.
3. **Launch:** as Admin, add a product with the Odoo variant, then a plan with its switches.
4. **Quote:** start from the Enterprise CRM template, fill in the customer, and send the quotation.
5. **Accept:** the customer accepts in the portal, and the subscription goes Confirmed, then Active.
6. **Billing day:** open Billing, run it, and show invoices created with taxes and the discount applied. Run it again to show nothing is billed twice.
7. **Payment:** confirm and print an invoice, record a part payment, then the rest, and watch it become Paid. Show the dashboard update live.
8. **Finance:** finish on the dashboard and reports, with overdue invoices and filters.

## 9. If we fall behind

Cut from the bottom of this list first. Never cut validation, or the demo story's main path.

| Order | Cut | Effect |
|---|---|---|
| 1 | PS-28 live dashboard | The dashboard refreshes on load instead |
| 2 | PS-29 limit on attempts | A security nice-to-have |
| 3 | Monthly revenue chart (part of PS-24) | The summary and filters remain |
| 4 | Portal add-on switches (part of PS-27) | Staff manage add-ons instead |
| 5 | Bulk confirm (part of PS-17) | Invoices are confirmed one at a time |

## 10. Risks

| Risk | What we do about it |
|---|---|
| Migration conflicts | One person changes the schema at a time, announced on the team chat |
| Merge conflicts in shared files | Every router and page already exists. Add routes only inside your own block in `App.jsx` |
| Money bugs | Everything is paise. All rounding goes through `applyPercent`, and `calculateInvoice()` has tests |
| Date bugs | Use only the helpers in `lib/dates.js`. Never use `new Date()` for a business date |
| A teammate's machine lacks PostgreSQL | Install it first thing. [Data Model §10](data-model.md#10-setup-and-day-to-day-use) has the steps |
| Running out of time for the video | Script ready by 4:30 PM. Recording starts at 5:00 PM |
