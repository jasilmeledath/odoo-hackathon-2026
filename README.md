# Brightloop Subscriptions

> One system to run products, plans, subscriptions, recurring billing, payments and revenue reporting for a subscription business.

Built for the **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026** (virtual round, 31 October 2026).

## Problem statement

Brightloop Software earns its money every month, but runs on a spreadsheet: renewals get missed, invoices are typed by hand, payments are matched by reading bank statements, and nobody can say how much recurring revenue the company has. This system runs the whole subscription month in one place, from a new customer signing up to the finance lead's numbers. The full breakdown is in [docs/requirements.md](docs/requirements.md).

## Demo video

No demo video is included in this repository.

## Features

- Customers can sign up and reset passwords; staff accounts and role access are managed by Admins (PS-1–PS-5).
- Staff can search, create and edit customers and inspect database-backed financial summaries (PS-12).
- Admins manage products, variants, plans, taxes, payment terms, discounts and quotation templates (PS-6–PS-11, PS-19).
- Staff create numbered subscriptions with validated lines, current prices, variants and taxes, then send and confirm quotations (PS-12–PS-13).
- Staff can activate subscriptions, pause and resume billing, renew the same subscription, or close early when the plan allows it (PS-13–PS-14).
- Scheduled processing activates subscriptions on their start dates, closes configured plans at expiry, and generates due invoices (PS-14–PS-16).
- Invoices can be reviewed, confirmed, sent, canceled when unpaid, and paid in full or in part with transactional balance protection (PS-17–PS-22).
- The finance dashboard and reports show active subscriptions, monthly recurring revenue, payments, invoices, amounts owed, overdue balances and renewals (PS-23–PS-24).
- Dashboard data refreshes when invoices or payments change (PS-28).
- Staff can search payments and browse paginated customer and catalog records.

## Screenshots

| Page | Mobile | Desktop |
|---|---|---|
| Login | [375 px](docs/screenshots/login-375.png) | [1280 px](docs/screenshots/login-1280.png) |
| Customer directory | [375 px](docs/screenshots/customers-375.png) | [1280 px](docs/screenshots/customers-1280.png) |
| Customer form | [375 px](docs/screenshots/customer-form-375.png) | [1280 px](docs/screenshots/customer-form-1280.png) |
| Plans | [Mobile](docs/screenshots/plans-mobile.png) | [Desktop](docs/screenshots/plans-desktop.png) |
| Product variants | [Mobile](docs/screenshots/products-mobile.png) | [Desktop](docs/screenshots/products-desktop.png) |
| Quotation templates | [Mobile](docs/screenshots/templates-mobile.png) | [Desktop](docs/screenshots/templates-desktop.png) |
| Record payment | [375 px](docs/screenshots/record-payment-375.png) | [1280 px](docs/screenshots/record-payment-1280.png) |
| Staff | [375 px](docs/screenshots/staff-375.png) | [1280 px](docs/screenshots/staff-1280.png) |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS v4 |
| Backend | Node.js, Express 5, organized into modules |
| Database | **PostgreSQL** (local) with the Prisma ORM |
| Validation | Zod on the server, with matching rules on the client |
| Auth | JWT and bcrypt |
| Live updates | Server-Sent Events |

Everything runs locally. There is no hosted database or backend service, and no third-party API in the core flow.

## Database

Database design is the heart of this project. [docs/data-model.md](docs/data-model.md) has the full documentation: the design decisions, ER diagram, every table and column, the check constraints that protect the data, and how each hard rule is guaranteed.

## Getting started

**Prerequisites:** Node.js 20.19 or later (or 22.12 or later), PostgreSQL 14 or later, and Git.

1. Clone the repository:

   ```bash
   git clone https://github.com/jasilmeledath/odoo-hackathon-2026.git
   ```

   ```bash
   cd odoo-hackathon-2026
   ```

2. Create the database:

   ```bash
   createdb brightloop_subscriptions
   ```

3. Set up the server:

   ```bash
   cd server
   ```

   ```bash
   cp .env.example .env
   ```

   Edit `server/.env`: set `DATABASE_URL` to your PostgreSQL user and password, and `JWT_SECRET` to a long random string.

   ```bash
   npm install
   ```

   ```bash
   npx prisma migrate deploy
   ```

   ```bash
   npm run db:generate
   ```

   ```bash
   npm run db:seed
   ```

4. Start the API on port 4000:

   ```bash
   npm run dev
   ```

5. In a second terminal, start the client from the repository root:

   ```bash
   cd client
   ```

   ```bash
   npm install
   ```

   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173).

Without SMTP settings in `server/.env`, emails such as password reset links are printed in the server terminal.

## Demo logins

Every account uses the password `Demo@12345`.

| Role | Email |
|---|---|
| Admin | `admin@demo.test` |
| Internal staff | `staff@demo.test` |
| Internal staff | `finance@demo.test` |
| Customer | `customer@demo.test` |
| Customer | `customer2@demo.test` |

## Project structure

```text
client/src/
  pages/<module>/      one folder of pages per module
  components/          shared UI
  lib/                 API client, auth, validators, formatters, hooks
server/
  prisma/              schema, migrations and seed data
  src/
    modules/<module>/  routes, service and schemas for each module
    middleware/        auth, validation, errors, request logging
    lib/               shared helpers
docs/                  requirements, plan, database, API and team standards
```

## Checks

From `server/`, run `npm test` for billing and catalog validation regressions.
The test runner uses the same tsx loader as the API for generated Prisma enums.
From `client/`, run `npm run build` to check the frontend.

### CI and local develop-to-main promotion

CI runs locally through Git hooks. Install the dependencies and enable the repository hooks once in each clone:

```bash
npm install
```

```bash
git config core.hooksPath .githooks
```

Set `server/.env` to a local PostgreSQL account that can create databases. With the hook enabled, feature-branch pushes run Prettier and the server tests; pushes to `develop` run the full gate. Any failed check stops the push, and direct pushes to `main` are blocked. To run the fast checks manually:

```bash
npm run ci:fast
```

From a clean, up-to-date `develop` branch, run the full gate manually without opening a PR:

```bash
npm run ci:local
```

To rerun the checks and create or locate the `develop`-to-`main` PR:

```bash
npm run promote:main
```

The full gate checks tracked source formatting, creates a disposable local database, applies migrations, runs `server` tests, and builds the client. It removes the temporary database afterward. `npm run promote:main` is the team process for promotion: it requires the current branch to be `develop`, a clean working tree, and local `develop` to match `origin/develop`; it then runs the full gate and opens the `develop`-to-`main` PR with the checked commit SHA in its description. Do not merge that PR unless the local promotion command passed for the same commit. The `gh` CLI must be installed and authenticated to create the PR.

## API

See [docs/api.md](docs/api.md).

## Known limitations

- Customer portal API flows are not implemented yet (PS-26 and PS-27).
- Starting a subscription from a quotation template is still in progress (PS-11).
- Page-level performance at 5,000 subscriptions is still being measured; the timings in [docs/data-model.md](docs/data-model.md#9-performance) cover queries, not full page loads (PS-25).
- Login and password-reset rate limiting is not implemented yet (PS-29).

## Team

| Name | GitHub | Owned |
|---|---|---|
| Jasil M (lead) | [@jasilmeledath](https://github.com/jasilmeledath) | Billing, invoices, database, integration |
| Yadhu Krishna P R | [@Yadh-Krishna](https://github.com/Yadh-Krishna) | Auth, staff, customers, payments, portal |
| Manoj PN | [@manojpnarayanan](https://github.com/manojpnarayanan) | Products, plans, taxes, discounts, templates |
| Jayasurya Suryadas | [@jsurya114](https://github.com/jsurya114) | Subscriptions, dashboard, reports |

## Contributing

Team rules are in [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/engineering-standards.md](docs/engineering-standards.md). Tasks and the timeline are in [docs/implementation-plan.md](docs/implementation-plan.md).


### Database integration tests

Use a separately created, migrated and seeded local database. Set
`TEST_DATABASE_URL` to its PostgreSQL connection URL, then run from `server/`:

```bash
npm run test:integration
```

These tests create and remove their own fixture subscriptions. Do not point them
at production data. They exercise transactional billing and concurrent runs.
