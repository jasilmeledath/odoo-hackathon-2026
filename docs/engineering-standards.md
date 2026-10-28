# Engineering Standards

| Field | Value |
|---|---|
| Version | 1.0 |
| Owner | Team lead (Jasil M) |
| Last updated | 29 October 2026 |
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

The organizers list these criteria. Every decision below serves one of them.

| Odoo criterion | Our rule |
|---|---|
| **Real-time or dynamic data** (no static JSON except for early prototyping) | Every screen reads from our API and database. No hard-coded arrays in components. Seed data lives in the database seed script ([§7](#7-database)). |
| **Responsive, clean UI** with a consistent colour scheme and layout | One theme file, a shared component set, and every screen checked at 375 px and 1280 px ([§9](#9-user-interface)) |
| **Robust input validation** | Validated on both client and server, with errors shown per field ([§8](#8-validation)) |
| **Intuitive navigation** with proper menu placement and spacing | One navigation layout, active states, and no dead links ([§9](#9-user-interface)) |
| **Proper Git use**, not one person managing the repo | [CONTRIBUTING.md](../CONTRIBUTING.md): everyone commits their own work every hour |
| *Nice to have:* backend APIs, data modelling, a local database | REST API with Express, Prisma models, SQLite or PostgreSQL ([§6](#6-backend-and-api), [§7](#7-database)) |
| *Nice to have:* understand AI and copied code | [§11](#11-ai-assisted-code) |
| *Nice to have:* offline and local first | Local database. No cloud services in the core flow, and no CDN dependencies at runtime |
| *Nice to have:* trendy tech only where it adds value | [§13](#13-scope-no-overkill) |

## 2. Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite, React Router, Tailwind CSS v4 |
| Backend | Node.js + Express 5 (ES modules) |
| Database | Prisma ORM. SQLite by default (no setup, works offline); PostgreSQL if the problem needs it |
| Validation | Zod on the server; matching rules on the client |
| Auth | JWT (`Authorization: Bearer`) with bcrypt password hashes |
| Live updates (only if the problem needs them) | Server-Sent Events |

We don't change the stack on the day. A new library needs a real reason, given in the commit body.

## 3. Project structure

```text
client/
  src/
    pages/          one file per route (RequestList.jsx)
    components/     shared UI (Layout.jsx, ui.jsx)
    lib/            api client, auth context, validators, formatters, hooks
    index.css       theme tokens (@theme) and component classes
server/
  prisma/           schema.prisma, migrations/, seed.js
  src/
    routes/         one router per domain module (requests.js)
    middleware/     auth, validate, error handling
    lib/            prisma client, validation schemas, errors, helpers
    index.js        app setup and route mounting only
docs/               the documents listed in docs/README.md
```

**Ownership** (agreed at 9:30 AM and recorded in [requirements.md](requirements.md)): each member owns one or more domain modules end to end (route, validation, page). Owning modules end to end keeps everyone's commits in different files and makes each person's contribution easy to see.

## 4. Coding standard

**All code**

- Keep functions small, each doing one job, with names that say what they do ([Naming Conventions](naming-conventions.md)).
- Use **named constants**, not magic values: `MAX_PAGE_SIZE = 50`, not `50` scattered around.
- **Handle every error path.** No empty `catch {}`. On the client, every failed request shows a message to the user.
- **Reuse before you write.** Use the shared helpers for API calls, validation, formatting and UI components. Copy-pasting a block a third time means it should be a helper.
- **Money** is shown with `Intl.NumberFormat('en-IN', { currency: 'INR' })`. If the problem involves real money calculations, store it in paise as integers (or `Decimal` on PostgreSQL), never as a float you add up.
- **Time** is stored in UTC by the database and shown in local time (IST) on screen.

**JavaScript**

- ES modules (`import`/`export`) everywhere. Use `const` by default and `let` only when you reassign. Never `var`.
- Use `async`/`await`, not `.then()` chains, except for one-liners.
- Use strict equality (`===`) only.
- **Prettier** formats everything (`npx prettier --write .`). Run it before you commit. Formatting-only changes go in their own `style` commit.
- No `console.log` left in committed code. `console.error` in the server's error handler is the only exception.

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
  // Requests module routes: CRUD plus the submit and review workflow
  // (PS-2, PS-3). Visibility rules live in loadRequest().
  ```

- Tag business rules with their requirement ID: `// PS-3: a reason is required when rejecting`.
- **No commented-out code.** Git keeps old code.
- **No `TODO` without context.** Write `TODO(PS-5): add CSV export once filters land`, and remove all TODOs by 4:30 PM, or list them under *Known limitations* in the README.

## 6. Backend and API

**Request flow:** route → `requireAuth` → `requireRole` (if needed) → `validate(schema)` → handler → Prisma.

- **REST, JSON, under `/api`.** Use plural nouns for resources and verbs only for workflow actions:

  | Action | Route |
  |---|---|
  | List (with filters) | `GET /api/requests?status=&q=&page=` |
  | Read | `GET /api/requests/:id` |
  | Create | `POST /api/requests` |
  | Update | `PUT /api/requests/:id` |
  | Delete | `DELETE /api/requests/:id` |
  | Workflow action | `POST /api/requests/:id/submit` |

- **Status codes:** `200` OK, `201` created, `204` deleted, `400` validation failed, `401` not logged in, `403` logged in but not allowed, `404` not found, or another user's record, `409` the action isn't allowed in the current state, `500` unexpected.
- **One error format** for every error:

  ```json
  { "error": "Validation failed", "fields": { "email": "Enter a valid email address" } }
  ```

  `fields` appears only for validation errors. Raw database or stack errors **never** reach the client.
- Throw `new HttpError(status, message, fields?)`. Express 5 passes thrown errors from async handlers to the error middleware, so don't write `try`/`catch` in every route.
- **Every list is paginated:** `page` and `pageSize`, at most 50. The response is `{ items, total, page, pageSize, pages }`.
- **Business rules live on the server.** The client hides a button the user can't use, but the server is what actually prevents the action.
- **Data isolation:** a user only reaches records they're allowed to see, and anything else returns `404`.
- Every API route is listed in [api.md](api.md) in the same commit that adds it.

## 7. Database

- The **Prisma schema is the data model.** One model per entity, with relations declared both ways.
- **Every schema change is a migration:** `npx prisma migrate dev --name <what-changed>`, committed with the `db` scope. Add "Run `npx prisma migrate dev` after pulling" to the commit body.
- One person changes `schema.prisma` at a time. Say so on the team chat before you start, because migration conflicts are painful.
- **Seed data** (`prisma/seed.js`) is realistic and covers every role and every status, so the demo and the evaluator see a working app at once. It is the only place sample data may live.
- **Indexes** go on foreign keys and on columns you filter by (`status`, `ownerId`).
- Enumerated values: use Prisma `enum` on PostgreSQL. On SQLite, use a `String` plus a Zod `z.enum([...])`, with the allowed values in a comment in the schema.
- Model names are singular PascalCase (`Request`) and fields are camelCase (`createdAt`). Every model has `id`, `createdAt` and, if it can be edited, `updatedAt`.

## 8. Validation

Validation is a named Odoo criterion. Every input is validated **twice**: on the client for instant feedback, and on the server as the source of truth.

| Rule | Detail |
|---|---|
| Server first | Every route that takes a body, query or params runs `validate(zodSchema)`. Schemas live in `server/src/lib/validation.js`. |
| Client mirrors server | `client/src/lib/validators.js` uses the same limits and **the same messages**. |
| Per-field errors | Each error appears **under its field**, in red, and the field gets a red border. Form-level errors (wrong password, server unreachable) appear in an alert above the form. |
| Server errors reach the UI | The `fields` from a `400` response go straight into the form's error state. |
| Clear, specific messages | "Password must be at least 8 characters", not "Invalid input". |
| Clean the input | Trim strings. Lowercase emails. Coerce numbers from strings. Reject unknown enum values. |
| Limits on everything | Minimum and maximum lengths on strings, ranges on numbers, a maximum page size, a JSON body limit (`100kb`). Use `maxLength` on inputs too. |
| Prevent double submits | Disable the submit button while a request is in flight. |
| Use `noValidate` on forms | Our messages replace the browser's own, so they look the same in every browser. |

**What to cover for each field type:** required · length · format (email, phone `^[6-9]\d{9}$` for Indian mobiles, URL) · range (amount > 0, dates not in the past where that matters) · allowed values (enums) · uniqueness (an email that's already registered returns `409` with a `fields.email` message) · cross-field rules (end date after start date).

## 9. User interface

- **One theme.** Colours, fonts and radii are defined only in `client/src/index.css` under `@theme`. Components use theme classes (`bg-brand-600`), **never** raw hex values.
- **Shared components:** `btn-primary`, `btn-secondary`, `btn-danger`, `card`, `input`, `label`, `Field`, `StatusBadge`, `Alert`, `Spinner`, `PageHeader`. Use these rather than restyling each screen.
- **Layout:** a sidebar on desktop and a top bar with a menu on mobile. Content is capped at `max-w-6xl`. Spacing follows Tailwind's scale (`gap-4`, `p-5`, `mb-6`). Don't pick arbitrary pixel values.
- **Navigation:** every page can be reached from the menu, and the current page is highlighted. Every detail page has a way back. There are no dead links or buttons that do nothing.
- **Responsive:** check every screen at **375 px** (phone) and **1280 px** (laptop) before pushing. Wide tables scroll horizontally inside their card. The page itself never scrolls sideways.
- **Feedback for every action:** loading spinners, disabled buttons while saving, success shown by navigating to the result or updating the view in place, and a confirmation before anything destructive.
- **Accessible basics:** every input has a `<label>`, buttons are `<button>` (never a clickable `<div>`), text contrast is readable, and forms submit on Enter.
- **Copy:** use sentence case ("New request", not "NEW REQUEST") and the problem statement's own words for entities and actions.

## 10. Security

- **No secrets in git.** Only `.env.example` with placeholders is committed. `JWT_SECRET` is a long random string in each person's local `.env`.
- Passwords are hashed with bcrypt (cost 10). Never log them, return them or store them in plain text. The API strips `passwordHash` before responding.
- Every route except register, login and health requires auth. Role checks happen on the server.
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

If there's spare time, add automated tests for the core business rule first (the workflow's state changes and permission checks).

**Integration checkpoints:** at **12:30 PM** and **3:30 PM**, everyone pulls `main` and the lead runs the full user journey end to end. Fix anything broken before starting new features.

## 13. Scope: no overkill

- **Build what the problem statement asks for, and build it well.** A smaller app that works and validates properly beats a large, half-broken one.
- **Not used** unless the problem clearly needs them: microservices, Docker, GraphQL, Redux, WebSockets (we use SSE), message queues, cloud functions, or AI APIs as decoration.
- **Feature priority:** (1) the core workflow working end to end, (2) validation and error states, (3) dashboard and search/filter, (4) polish, (5) extras.
- **Feature freeze at 4:30 PM.** After that we only fix bugs, update the README and prepare the demo.

## 14. Definition of done

A feature is done when all of the following are true:

- [ ] It meets its `PS-n` requirement and the checks in [§12](#12-testing-and-checking) pass
- [ ] It's validated on both client and server, with per-field messages
- [ ] It has loading, error and empty states
- [ ] It uses theme classes and shared components, and works at 375 px and 1280 px
- [ ] Data comes from the API and database: no static JSON, no hard-coded arrays
- [ ] It's reachable from the navigation
- [ ] [api.md](api.md) and the README are updated if a route, env var or setup step changed
- [ ] It's committed with a message that follows [CONTRIBUTING.md](../CONTRIBUTING.md) and pushed to `main`
