# Brightloop Subscriptions

> One system to run products, plans, subscriptions, recurring billing, payments and revenue reporting for a subscription business.

Built for the **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026** (virtual round, 31 October 2026).

## Problem statement

Brightloop Software earns its money every month, but runs on a spreadsheet: renewals get missed, invoices are typed by hand, payments are matched by reading bank statements, and nobody can say how much recurring revenue the company has. This system runs the whole subscription month in one place, from a new customer signing up to the finance lead's numbers. The full breakdown is in [docs/requirements.md](docs/requirements.md).

## Demo video

*Link added after submission.*

## Features

- Active accounts log in with expiring tokens and role-based navigation (PS-2).
- Staff can read paginated catalog data; Admins can create, edit and deactivate tax rules and payment terms (PS-10, PS-12).
- Admins can create, edit and deactivate products, with rupee inputs and margin calculation; staff can browse filtered product lists (PS-6).

- Add staff-only customer search, create/edit forms and detail summaries aggregated by status. (PS-12).

## Screenshots

*Added at 4:45 PM from `docs/screenshots/`.*

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

### Local develop-to-main promotion

The local gate replaces GitHub Actions for promotion checks and keeps `main` PR-only. Install the root Prettier dependency and enable the repository hooks once:

```bash
npm install
```

```bash
git config core.hooksPath .githooks
```

Set `server/.env` to a local PostgreSQL account that can create databases. From a clean, up-to-date `develop` branch, run the checks without opening a PR:

```bash
npm run ci:local
```

To rerun the checks and create or locate the `develop`-to-`main` PR:

```bash
npm run promote:main
```

The gate checks tracked source formatting, creates a disposable local database, applies migrations, runs `server` tests, and builds the client. It removes the temporary database afterward. The promotion command requires local `develop` to match `origin/develop`; the pre-push hook blocks direct pushes to `main`. Review and merge the generated PR through the normal flow. The `gh` CLI must be installed and authenticated to create that PR.

## API

See [docs/api.md](docs/api.md).

## Known limitations

*Filled in honestly at 4:45 PM.*

## Team

| Name | GitHub | Owned |
|---|---|---|
| Jasil M (lead) | [@jasilmeledath](https://github.com/jasilmeledath) | Billing, invoices, database, integration |
| Yadhu Krishna P R | [@Yadh-Krishna](https://github.com/Yadh-Krishna) | Auth, staff, customers, payments, portal |
| Manoj PN | [@manojpnarayanan](https://github.com/manojpnarayanan) | Products, plans, taxes, discounts, templates |
| Jayasurya Suryadas | [@jsurya114](https://github.com/jsurya114) | Subscriptions, dashboard, reports |

## Contributing

Team rules are in [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/engineering-standards.md](docs/engineering-standards.md). Tasks and the timeline are in [docs/implementation-plan.md](docs/implementation-plan.md).
