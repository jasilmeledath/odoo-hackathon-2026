# Requirements

| Field | Value |
|---|---|
| Version | 1.0 |
| Owner | Team lead (Jasil M) |
| Last updated | 31 October 2026 |
| Related documents | [Implementation Plan](implementation-plan.md) · [Data Model](data-model.md) · [API Reference](api.md) · [Engineering Standards](engineering-standards.md) |

The chosen problem statement, split into numbered requirements. Commits reference these IDs (`Refs: PS-3`) and code tags business rules with them (`// PS-3: …`).

## Problem statement

**Subscription Management System.** Build one system to run plans, subscriptions and recurring billing in one place. Source: the problem statement PDF from the hackathon portal.

Brightloop Software sells everything on subscription: software billed monthly or yearly, add-ons, and products with variants. Today it tracks subscriptions in a spreadsheet, types invoices by hand, matches payments by reading bank statements, and builds revenue reports once a quarter. Renewals get missed, invoices go out wrong, and nobody can say how much recurring revenue the company has.

**In plain words:** the system remembers every customer's plan, bills them at the right time with the right price, tax and discount, tracks who has paid, and shows the finance lead the true numbers at any moment.

## Users and roles

| Role | Who | What they can do |
|---|---|---|
| **Admin** (`ADMIN`) | Runs the system | Everything, including products, plans, taxes, discounts, quotation templates and adding staff |
| **Internal staff** (`INTERNAL`) | Sales and accounts team | Customers, subscriptions, billing, invoices, payments and reports. Reads the catalog but cannot change it |
| **Customer** (`CUSTOMER`) | A business that buys from Brightloop | Only their own subscriptions and invoices, through the portal |

## Requirements

**Priority:** **P1** core flow, must work by the 12:30 PM checkpoint · **P2** stated in the problem, must work by the 3:30 PM checkpoint · **P3** extra, only if time allows.
**Status:** Not started · In progress · Done · Dropped (with a reason).

### Access

| ID | Requirement | Priority | Owner | Status |
|---|---|---|---|---|
| PS-1 | A customer signs up with email and password. Each email belongs to one account. The password must be **more than eight characters** with an uppercase letter, a lowercase letter and a special character | P1 | Yadhu | Not started |
| PS-2 | Users log in and stay logged in with a token that expires | P1 | Yadhu | Not started |
| PS-3 | A forgotten password is reset through a link sent to the registered email | P1 | Yadhu | Not started |
| PS-4 | Three roles see different things. Customers see only their own records, and any other record returns `404` | P1 | Yadhu | Not started |
| PS-5 | Only the Admin can add a staff member, and sign-up can never create staff | P1 | Yadhu | Not started |

### Catalog

| ID | Requirement | Priority | Owner | Status |
|---|---|---|---|---|
| PS-6 | The Admin manages products: name, type, sales price, cost price and notes | P1 | Manoj | In progress |
| PS-7 | A product has variants, each adding an extra price (choosing the Odoo brand adds 560) | P1 | Manoj | Not started |
| PS-8 | The Admin manages plans: price, billing period (daily, weekly, monthly, yearly), minimum quantity and the dates it is available | P1 | Manoj | In progress |
| PS-9 | Plan by plan, the Admin decides whether it closes by itself at the end, and whether it can be closed early, paused or renewed | P1 | Manoj | Not started |
| PS-10 | The Admin sets tax rules, and taxes are calculated from them automatically | P1 | Manoj | In progress |

### Subscriptions

| ID | Requirement | Priority | Owner | Status |
|---|---|---|---|---|
| PS-11 | Quotation templates hold the plan and product lines and stay valid for a set number of days. A quotation can start from one | P2 | Manoj | Not started |
| PS-12 | A subscription has its own number, customer, plan, start date, expiry date, payment terms, and lines with product, quantity, unit price, taxes and amount | P1 | Jayasurya | In progress |
| PS-13 | A subscription moves Draft → Quotation → Confirmed → Active → Closed, and the team can see where it stands and its history | P1 | Jayasurya | Not started |
| PS-14 | Subscriptions can be closed early, paused or renewed when the plan allows it, and close by themselves when the plan says so | P2 | Jayasurya | Not started |

### Billing

| ID | Requirement | Priority | Owner | Status |
|---|---|---|---|---|
| PS-15 | On billing day, invoices are created from due subscriptions with customer details, lines, taxes and totals filled in. Nothing is billed twice or skipped | P1 | Jasil | Not started |
| PS-16 | Taxes on invoices are calculated automatically from the Admin's rules | P1 | Jasil | In progress |
| PS-17 | An invoice moves Draft → Confirmed → Paid, and can be canceled | P1 | Jasil | Not started |
| PS-18 | The team can send or print any invoice | P2 | Jasil | Not started |

### Discounts

| ID | Requirement | Priority | Owner | Status |
|---|---|---|---|---|
| PS-19 | Only the Admin creates discount rules: fixed or percentage, minimum purchase or quantity, start and end dates, usage limit, and scope (specific products or the whole subscription) | P2 | Manoj | Not started |
| PS-20 | A discount that applies appears on the next invoice by itself, and stops when it expires or runs out | P2 | Jasil | In progress |

### Payments and reporting

| ID | Requirement | Priority | Owner | Status |
|---|---|---|---|---|
| PS-21 | A payment is recorded with method, amount, date and note against the right invoice | P1 | Yadhu | Not started |
| PS-22 | The team can see which invoices are paid, outstanding and overdue at any moment | P1 | Yadhu | Not started |
| PS-23 | The finance lead sees active subscriptions, revenue, payments, amounts owed and overdue invoices in one place | P1 | Jayasurya | Not started |
| PS-24 | Reports have filters and a summary view | P2 | Jayasurya | Not started |
| PS-25 | With thousands of subscriptions, every page responds in under two seconds | P2 | Everyone | Not started |

### Customer portal

| ID | Requirement | Priority | Owner | Status |
|---|---|---|---|---|
| PS-26 | Customers see their own subscriptions and invoices through a portal | P1 | Yadhu | Not started |
| PS-27 | Customers manage their own subscriptions: accept a quotation, switch add-ons on and off, and pause or close where the plan allows | P2 | Yadhu | Not started |

### Beyond the problem statement

| ID | Requirement | Priority | Owner | Status |
|---|---|---|---|---|
| PS-28 | The dashboard updates live, using Server-Sent Events, when a payment or invoice changes. Odoo strongly recommends real-time data | P2 | Jayasurya | Not started |
| PS-29 | Login and password reset limit repeated attempts | P2 | Yadhu | Not started |

## Module ownership

Each member owns their modules end to end: database queries, routes, validation, pages and docs. The module names are also commit scopes (`.githooks/scopes`). This split is a proposal: swap names to fit the team's strengths, then update this table.

| Member | Modules (scopes) | Requirements |
|---|---|---|
| Jasil M (lead) | `billing`, `invoices`, `db`, integration, portal submissions, demo | PS-15 to PS-18, PS-20 |
| Yadhu Krishna P R | `auth`, `staff`, `customers`, `payments`, `portal` | PS-1 to PS-5, PS-21, PS-22, PS-26, PS-27, PS-29 |
| Manoj PN | `products`, `plans`, `taxes`, `terms`, `discounts`, `templates` | PS-6 to PS-11, PS-19 |
| Jayasurya Suryadas | `subscriptions`, `reports`, `dashboard` | PS-12 to PS-14, PS-23, PS-24, PS-28 |

## Assumptions

Anything the problem statement leaves open, and what we decided.

| # | Question | Decision |
|---|---|---|
| A-1 | What does "more than eight characters" mean? | At least **9** characters. A digit is not required, because the problem does not ask for one |
| A-2 | How long does a reset link last? | 30 minutes, single use. The token is stored only as a hash. The response is the same whether or not the email exists, so nobody can probe for accounts |
| A-3 | How does email work offline? | Through SMTP when configured. Otherwise the server prints the email in its terminal |
| A-4 | Is a customer the same thing as a login? | No. `users` holds logins and `customers` holds who we bill, because a sales rep can prepare an offer for a customer who has no account yet. Signing up links the login to the customer with the same email |
| A-5 | How do plan price and sales price relate? | A plan sells one product. On that product's line, the plan price replaces the sales price. Other lines use the sales price. A variant's extra price is added in both cases |
| A-6 | What does the minimum quantity apply to? | The line for the plan's own product, not add-on lines |
| A-7 | Who manages quotation templates? | The Admin. Internal staff use them |
| A-8 | How many taxes can a line have? | One, as a percentage of the amount after discount |
| A-9 | When is a period billed, and is a part period prorated? | Billed in advance on its first day, for the full period, with no proration. Billing stops once the next period would start on or after the expiry date |
| A-10 | What does a billing run produce? | Draft invoices. The team reviews and confirms them, individually or in bulk |
| A-11 | What if several discounts match? | The one that saves the customer the most applies. An invoice has at most one discount |
| A-12 | Does tax apply before or after a discount? | After. Tax is charged on the discounted amount |
| A-13 | When does a discount count as used? | Once per invoice. Canceling the invoice gives the use back |
| A-14 | Are part payments allowed? | Yes, on confirmed invoices. A payment above the balance is rejected. The invoice becomes Paid when fully paid |
| A-15 | What does overdue mean? | A confirmed invoice whose due date has passed. It is worked out from the data, never stored, so it cannot go stale |
| A-16 | Can a paid invoice be canceled? | No. An invoice with any payment cannot be canceled |
| A-17 | What happens to a canceled invoice's period? | The period returns to the billing queue, so it is not skipped |
| A-18 | Does pausing bill later for the paused time? | No. Nothing is billed while paused, and billing resumes at the next period boundary |
| A-19 | What does renewing do? | It extends the expiry date of the same subscription, keeping its history in one place |
| A-20 | What happens at expiry if the plan does not close by itself? | The subscription stays Active, billing stops, and it appears on the dashboard's renewal list |
| A-21 | When does Confirmed become Active? | On the start date through the daily job, or earlier by staff |
| A-22 | What is revenue? | Payments received in the period. Invoiced and outstanding amounts are shown separately. Monthly recurring revenue is before tax and discount |
| A-23 | Currencies, companies and time zones? | Indian rupees, one company, business days in IST |
