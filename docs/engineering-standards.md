# Engineering Standards

| Field | Value |
|---|---|
| Version | 1.1 |
| Owner | Team lead (Jasil M) |
| Last updated | 31 October 2026 |
| Related documents | [CONTRIBUTING.md](../CONTRIBUTING.md) · [Naming Conventions](naming-conventions.md) · [Documentation Rules](documentation-rules.md) · [Requirements](requirements.md) |

This document is the single source of truth for **how we write code** during the hackathon. It applies to every team member and every AI coding assistant, and **everyone reads it before the first commit**. `CLAUDE.md` and any other agent rule files only point here.

**Order of precedence:** (1) the **problem statement** decides what we build. (2) **Odoo's judging criteria** ([§1](#1-what-odoo-judges)) decide how we build it. (3) This document records the team's decisions within those limits. If two of them disagree, raise it with the lead before writing code.

---

## Contents

1. [What Odoo judges](#1-what-odoo-judges)
2. [Stack](#2-stack)
3. [Project structure](#3-project-structure)
4. [Coding standard](#4-coding-standard)
5. [Comments](#5-comments)
6. [Backend and API](#6-backend-and-api)
7. [Database](#7-database)
8. [Validation](#8-validation)
9. [User interface](#9-user-interface)
10. [Security](#10-security)
11. [AI-assisted code](#11-ai-assisted-code)
12. [Testing and checking](#12-testing-and-checking)
13. [Scope: no overkill](#13-scope-no-overkill)
14. [Definition of done](#14-definition-of-done)

---

## 1. What Odoo judges

Odoo evaluates **coding standards, logic, modularity, frontend design, performance, scalability, security, usability, debugging skill and, most importantly, database design.** They value approaching the problem thoughtfully, and well-structured, clean, clearly named code. Every decision below serves these.

| Evaluation area | Our rule |
|---|---|
| **Database design** (most important) | Local PostgreSQL, a normalized schema, real foreign keys, native enums, check constraints and indexes, all documented ([§7](#7-database), [Data Model](data-model.md)) |
| **Coding standards** | [§4](#4-coding-standard), [§5](#5-comments) and [Naming Conventions](naming-conventions.md) |
| **Logic** | Business rules are explicit, tested where they carry money, and tagged with their `PS-n` ([§6](#6-backend-and-api)) |
| **Modularity** | One folder per module, with routes, services and schemas apart ([§3](#3-project-structure)) |
| **Frontend design and usability** | One theme, shared components, menus that follow the business, graceful errors ([§8](#8-validation), [§9](#9-user-interface)) |
| **Performance and scalability** | Pagination, indexes, database-side totals, no N+1 queries, batched billing ([§7](#7-database)) |
| **Security** | Server-side role checks, hashed secrets, data isolation ([§10](#10-security)) |
| **Debugging skill** | One error format, request logs, an activity timeline, and the ability to explain every failure ([§12](#12-testing-and-checking)) |

The organizers' other expectations:

| Odoo expectation | Our rule |
|---|---|
| **Build from scratch with a local database** | No backend-as-a-service: no Firebase, Supabase or MongoDB Atlas. Minimal third-party APIs, so an outside bug or outage cannot break the app ([§13](#13-scope-no-overkill)) |
| **Real-time or dynamic data** (static JSON only for quick prototyping) | Every screen reads from our API and database. No hard-coded arrays in components. Seed data lives in the database seed script ([§7](#7-database)). Live updates use Server-Sent Events. |
| **Responsive, clean UI** with a consistent colour scheme and layout | One theme file, a shared component set, and every screen checked at 375 px and 1280 px ([§9](#9-user-interface)) |
| **Robust input validation** | Validated on both client and server, with errors shown per field ([§8](#8-validation)) |
| **Intuitive navigation** with proper menu placement and spacing | One navigation layout, active states, and no dead links ([§9](#9-user-interface)) |
| **Proper Git use**, not one person managing the repo | [CONTRIBUTING.md](../CONTRIBUTING.md): everyone commits their own work every hour |
| *Nice to have:* understand AI and copied code | [§11](#11-ai-assisted-code) |
| *Nice to have:* offline and local first | Local database. No cloud services in the core flow, and no CDN dependencies at runtime |
| *Nice to have:* trendy tech only where it adds value | [§13](#13-scope-no-overkill) |

## 2. Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite, React Router, Tailwind CSS v4 |
| Backend | Node.js + Express 5 (ES modules) |
| Database | **PostgreSQL**, local, through the Prisma ORM. No hosted database or backend service |
| Validation | Zod on the server; matching rules on the client |
| Auth | JWT (`Authorization: Bearer`) with bcrypt password hashes |
| Live updates | Server-Sent Events |
| Email | Nodemailer over SMTP, or printed in the server terminal when SMTP is not configured |

We don't change the stack on the day. A new library needs a real reason, given in the commit body.

## 3. Project structure

```text
client/
  src/
    pages/<module>/ one file per route (subscriptions/SubscriptionList.jsx)
    components/     shared UI (Layout.jsx, ui.jsx)
    lib/            api client, auth context, validators, formatters, hooks
    index.css       theme tokens (@theme) and component classes
server/
  prisma/           schema.prisma, migrations/, seed.js
  src/
    modules/<module>/
      <module>.routes.js    HTTP only: guards, validation, calling the service
      <module>.service.js   business rules and database queries
      <module>.schemas.js   Zod schemas
    middleware/     auth, validate, error handling, request logging
    lib/            shared helpers (prisma, dates, money, numbering, pagination)
    index.js        app setup and route mounting only
docs/               the documents listed in docs/README.md
```

**One module never queries another module's tables to change them.** It calls that module's service, so each rule lives in exactly one place. The portal, for example, reuses the subscriptions service rather than copying its rules.

**Ownership** (agreed at 9:30 AM and recorded in [requirements.md](requirements.md)): each member owns one or more domain modules end to end (route, validation, page). Owning modules end to end keeps everyone's commits in different files and makes each person's contribution easy to see.

## 4. Coding standard

**All code**

- Keep functions small, each doing one job, with names that say what they do ([Naming Conventions](naming-conventions.md)).
- Use **named constants**, not magic values: `MAX_PAGE_SIZE = 50`, not `50` scattered around.
- **Handle every error path.** No empty `catch {}`. On the client, every failed request shows a message to the user.
- **Reuse before you write.** Use the shared helpers for API calls, validation, formatting and UI components. Copy-pasting a block a third time means it should be a helper.
- **Money** is whole paise everywhere: in the database, the API and server code. Convert only at the edges of the client with `toPaise` and `formatMoney`. All percentage rounding goes through `applyPercent` in `lib/money.js`.
- **Dates** use the helpers in `lib/dates.js`. Calendar dates are `YYYY-MM-DD` in the API and `DATE` in the database. Never use `new Date()` for a business date: use `today()`, which follows IST.

**JavaScript**

- ES modules (`import`/`export`) everywhere. Use `const` by default and `let` only when you reassign. Never `var`.
- Use `async`/`await`, not `.then()` chains, except for one-liners.
- Use strict equality (`===`) only.
- **Prettier** formats everything (`npx prettier --write .`). Run it before you commit. Formatting-only changes go in their own `style` commit.
- No `console.log` left in committed code. The only logging is `console.error` in the server's error handler, and `console.info` for the start-up line, the request log and the offline email fallback.

**React**

- Use function components and hooks only.
- One page component per route, kept under about 200 lines. Pull large sections out into components.
- Hold state where it's used. Use the auth context for the user, and the URL search params for list filters, so filters survive a refresh.
- Every list item has a stable `key` (the record's `id`, never the array index).
- Every data-fetching screen has three states: **loading** (spinner), **error** (an alert with the message) and **empty** (a helpful message, not a blank table).

## 5. Comments

- **Comment the why, not the what.** The code says what it does. A comment explains a reason, a constraint or a consequence that isn't obvious.
- Every source file starts with a **one-to-three-line overview** of what it holds. Never put author names or dates in it: git history records those.

  ```js
  // Subscription status changes (PS-13, PS-14). The allowed moves live in
  // assertTransition(), so routes and the portal share one set of rules.
  ```

- Tag business rules with their requirement ID: `// PS-1: passwords must be more than eight characters`.
- **No commented-out code.** Git keeps old code.
- **No `TODO` without context.** Write `TODO(PS-24): add the revenue chart once filters land`, and remove all TODOs by 4:30 PM, or list them under *Known limitations* in the README.

## 6. Backend and API

**Request flow:** route → `requireAuth` → `requireRole` (if needed) → `validate(schema)` → handler → service → Prisma. Handlers stay short. Rules and queries live in the service.

- **REST, JSON, under `/api`.** Use plural nouns for resources and verbs only for workflow actions:

  | Action | Route |
  |---|---|
  | List (with filters) | `GET /api/subscriptions?status=&q=&page=` |
  | Read | `GET /api/subscriptions/:id` |
  | Create | `POST /api/subscriptions` |
  | Update | `PUT /api/subscriptions/:id` |
  | Delete | `DELETE /api/plans/:id` |
  | Workflow action | `POST /api/subscriptions/:id/confirm` |

- **Status codes:** `200` OK, `201` created, `204` deleted, `400` validation failed, `401` not logged in, `403` logged in but not allowed, `404` not found, or another user's record, `409` the action isn't allowed in the current state, `500` unexpected.
- **One error format** for every error:

  ```json
  { "error": "Validation failed", "fields": { "email": "Enter a valid email address" } }
  ```

  `fields` appears only for validation errors. Raw database or stack errors **never** reach the client.
- Throw `new HttpError(status, message, fields?)`. Express 5 passes thrown errors from async handlers to the error middleware, so don't write `try`/`catch` in every route.
- **Every list is paginated:** `page` and `pageSize`, at most 50, using `listQuerySchema` and `paginate()`. The response is `{ items, total, page, pageSize, pages }`.
- **Multi-step changes run in one transaction** (`prisma.$transaction`), so a failure leaves nothing half done.
- **Business rules live on the server.** The client hides a button the user can't use, but the server is what actually prevents the action.
- **Data isolation:** a user only reaches records they're allowed to see, and anything else returns `404`.
- Every API route is listed in [api.md](api.md) in the same commit that adds it.

## 7. Database

Database design is what Odoo weighs most. [Data Model](data-model.md) is the full reference.

- The **Prisma schema is the data model.** One model per entity, with relations declared both ways. Tables are mapped to snake_case plurals with `@@map`, and columns to snake_case with `@map`.
- **The database protects itself.** Validation gives friendly messages; `CHECK` constraints, foreign keys, unique indexes and enums are the final guard.
- **Every schema change is a migration:** `npx prisma migrate dev --name <what_changed>`, committed with the `db` scope. Add "Run `npx prisma migrate dev` after pulling" to the commit body.
- **Check constraints and partial indexes** go in a migration created with `--create-only`, because Prisma cannot express them.
- One person changes `schema.prisma` at a time. Say so on the team chat before you start, because migration conflicts are painful.
- **Update [data-model.md](data-model.md) in the same commit** as every migration.
- **Seed data** (`prisma/seed.js`) is realistic and covers every role and every status, so the demo and the evaluator see a working app at once. It is the only place sample data may live.
- **Indexes** go on foreign keys and on columns you filter by, in the order queries use them (`status`, then `dueDate`).
- **Enumerated values** are native Prisma enums. Zod reads them with `z.enum(InvoiceStatus)`, so the list exists once.
- **Types:** money is `Int` paise, rates are `Decimal(5,2)`, calendar dates are `@db.Date`, moments are `@db.Timestamptz(3)`, and text is `@db.VarChar(n)`.
- **Delete rules are deliberate.** Financial history uses `Restrict`. Records that have been used are deactivated with `isActive`, not deleted.
- **Totals are calculated in the database** with `aggregate`, never by loading rows into JavaScript. Fetch related rows with `include` or `select`, never in a loop, and select only what the screen needs.
- Model names are singular PascalCase (`Subscription`) and fields are camelCase (`createdAt`). Every model has `id`, `createdAt` and, if it can be edited, `updatedAt`.

## 8. Validation

Validation is a named Odoo criterion. Every input is validated **twice**: on the client for instant feedback, and on the server as the source of truth.

| Rule | Detail |
|---|---|
| Server first | Every route that takes a body, query or params runs `validate(zodSchema)`. Schemas live in `server/src/lib/validation.js`. |
| Client mirrors server | `client/src/lib/validators.js` uses the same limits and **the same messages**. |
| Per-field errors | Each error appears **under its field**, in red, and the field gets a red border. Form-level errors (wrong password, server unreachable) appear in an alert above the form. |
| Server errors reach the UI | The `fields` from a `400` response go straight into the form's error state. |
| Clear, specific messages | "Password must be more than 8 characters", not "Invalid input". Say how to fix it, and never show a raw error to the user. |
| Clean the input | Trim strings. Lowercase emails. Coerce numbers from strings. Reject unknown enum values. |
| Limits on everything | Minimum and maximum lengths on strings, ranges on numbers, a maximum page size, a JSON body limit (`100kb`). Use `maxLength` on inputs too. |
| Prevent double submits | Disable the submit button while a request is in flight. |
| Use `noValidate` on forms | Our messages replace the browser's own, so they look the same in every browser. |

**What to cover for each field type:** required · length · format (email, phone `^[6-9]\d{9}$` for Indian mobiles, URL) · range (amount > 0, dates not in the past where that matters) · allowed values (enums) · uniqueness (an email that's already registered returns `409` with a `fields.email` message, thrown by the service as `HttpError` rather than left to the database) · cross-field rules (end date after start date).

## 9. User interface

- **One theme.** Colours, fonts and radii are defined only in `client/src/index.css` under `@theme`. Components use theme classes (`bg-brand-600`), **never** raw hex values.
- **Shared components:** `btn-primary`, `btn-secondary`, `btn-danger`, `card`, `input`, `label`, `Field`, `StatusBadge`, `Alert`, `Spinner`, `PageHeader`. Use these rather than restyling each screen.
- **Layout:** a sidebar on desktop and a top bar with a menu on mobile. Menus are grouped the way the business works (Sales, Billing, Catalog) and show only what the role can use. Content is capped at `max-w-6xl`. Spacing follows Tailwind's scale (`gap-4`, `p-5`, `mb-6`). Don't pick arbitrary pixel values.
- **Navigation:** every page can be reached from the menu, and the current page is highlighted. Every detail page has a way back. There are no dead links or buttons that do nothing.
- **Responsive:** check every screen at **375 px** (phone) and **1280 px** (laptop) before pushing. Wide tables scroll horizontally inside their card. The page itself never scrolls sideways.
- **Feedback for every action:** loading spinners, disabled buttons while saving, success shown by navigating to the result or updating the view in place, and a confirmation before anything destructive.
- **Accessible basics:** every input has a `<label>`, buttons are `<button>` (never a clickable `<div>`), text contrast is readable, and forms submit on Enter.
- **Copy:** use sentence case ("New subscription", not "NEW SUBSCRIPTION") and the problem statement's own words for entities and actions.

## 10. Security

- **No secrets in git.** Only `.env.example` with placeholders is committed. `JWT_SECRET` is a long random string in each person's local `.env`.
- Passwords are hashed with bcrypt (cost 10). Never log them, return them or store them in plain text. The API strips `passwordHash` before responding.
- Every route except sign-up, login, password reset and health requires auth. Role checks happen on the server.
- A customer only reaches their own records: every portal query filters by `req.user.customerId`, and anything else returns `404`.
- The role is never read from a request body or a login token. `requireAuth` loads the user on every request, so deactivating someone or changing their role applies at once, and a password change ends older sessions. Password reset tokens are stored only as hashes, are single use and expire.
- Prisma's parameterised queries only. Never build SQL from strings.
- CORS allows only the client origin. JSON body size is limited.

## 11. AI-assisted code

The organizers ask us to "understand AI/code snippets thoroughly before using them" and not to copy-paste blindly. So:

- **The person who commits AI-generated code owns it.** You have read every line, adapted it to our structure and naming, and **can explain it to the evaluator**.
- AI output follows these standards like any other code: our helpers, our error format, our theme. Rewrite anything that brings in a different pattern.
- Don't paste a whole generated file you haven't read. Generate small pieces, read them and run them.
- Add `Co-authored-by:` or note `AI-assisted: yes` in the pull request when an assistant wrote a meaningful part.
- AI assistants read `CLAUDE.md`, which points them to this document and to CONTRIBUTING.md.

## 12. Testing and checking

There's no time for a full test suite, so every change is **checked by hand** before it's pushed:

1. The server starts with no errors, and the client builds (`npm run build`).
2. The happy path of the feature works in the browser.
3. **Bad input** is rejected with the right message, on both client and server. For the server, test with `curl` or the browser's network tab, not only through the UI.
4. A user without permission gets `403` or `404`.
5. The screen looks right at 375 px and 1280 px.
6. The browser console shows no errors.

**Automated tests** cover the invoice calculation, because it carries money (`node --test`). If there's spare time, add the workflow's state changes and permission checks next.

**Debugging.** Reproduce the failure first, then read the evidence: the browser's network tab, the server's request log line, and the stack trace from the error handler. For data problems, check the table with `npx prisma studio` and slow queries with `EXPLAIN ANALYZE`. Fix the cause, not the symptom, and say what the cause was in the `fix` commit body. Everyone should be able to explain to the evaluator how they found a bug.

**Integration checkpoints:** at **12:30 PM** and **3:30 PM**, everyone pulls `develop` and the lead runs the full user journey end to end. Fix anything broken before starting new features.

## 13. Scope: no overkill

- **Build what the problem statement asks for, and build it well.** A smaller app that works and validates properly beats a large, half-broken one.
- **Built from scratch, with minimal third parties.** No backend-as-a-service (Firebase, Supabase, MongoDB Atlas), no payment gateways and no outside APIs in the core flow. Every dependency is one more thing that can break, so we write small helpers ourselves when we reasonably can.
- **Not used** unless the problem clearly needs them: microservices, Docker, GraphQL, Redux, WebSockets (we use SSE), message queues, cloud functions, chart libraries, or AI APIs as decoration.
- **Feature priority:** (1) the core workflow working end to end, (2) validation and error states, (3) dashboard and search/filter, (4) polish, (5) extras.
- **Feature freeze at 4:30 PM.** After that we only fix bugs, update the README and prepare the demo.

## 14. Definition of done

A feature is done when all of the following are true:

- [ ] It meets its `PS-n` requirement and the checks in [§12](#12-testing-and-checking) pass
- [ ] It's validated on both client and server, with per-field messages
- [ ] It has loading, error and empty states
- [ ] It uses theme classes and shared components, and works at 375 px and 1280 px
- [ ] Data comes from the API and database: no static JSON, no hard-coded arrays
- [ ] Rules are in the service, and any schema change is migrated and documented in [data-model.md](data-model.md)
- [ ] It's reachable from the navigation
- [ ] [api.md](api.md) and the README are updated if a route, env var or setup step changed, and the `PS-n` status in [requirements.md](requirements.md) is current
- [ ] It's committed with a message that follows [CONTRIBUTING.md](../CONTRIBUTING.md) and merged into `develop` through a pull request
