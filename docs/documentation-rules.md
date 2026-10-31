# Documentation Rules

| Field | Value |
|---|---|
| Version | 1.1 |
| Owner | Team lead (Jasil M) |
| Last updated | 31 October 2026 |
| Related documents | [Engineering Standards](engineering-standards.md) · [CONTRIBUTING.md](../CONTRIBUTING.md) |

The evaluator opens the repository before running the app. Documentation is how they find out, in two minutes, what we built, how to run it and who did what. These rules keep it accurate without slowing us down.

---

## 1. What documents exist

| Document | Purpose | Owner | Must be complete by |
|---|---|---|---|
| [`README.md`](../README.md) | The front page: the problem, features, stack, setup, demo logins, screenshots, team | Lead | **4:45 PM** (setup section by 11:00 AM) |
| [`docs/requirements.md`](requirements.md) | The problem statement split into numbered requirements (`PS-n`), each with its owner and status | Lead | **9:30 AM**, then statuses kept current |
| [`docs/implementation-plan.md`](implementation-plan.md) | How we build it: timeline, tasks by owner, billing design, demo story | Lead | Done, then kept current |
| [`docs/api.md`](api.md) | Every API route: the route map, then method, path, auth, body, response and errors | Whoever adds the route | **In the same commit as the route** |
| [`docs/data-model.md`](data-model.md) | The complete database documentation: design decisions, ER diagram, every table and column, constraints, lifecycles, setup | Whoever changes `schema.prisma` | In the same commit as each migration |
| [`docs/engineering-standards.md`](engineering-standards.md) | How we write code | Lead | Done (before the event) |
| [`docs/naming-conventions.md`](naming-conventions.md) | How we name things | Lead | Done (before the event) |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Git, commit and pull request rules | Lead | Done (before the event) |
| `.env.example` (in `server/` and `client/` if needed) | Every environment variable, with a placeholder value and a comment | Whoever adds the variable | In the same commit as the variable |

Nothing else. No separate design doc, no meeting notes, no changelog: the commit history is our changelog.

## 2. When docs change

**Docs change in the same commit as the code they describe.** A reviewer or the evaluator should never find docs that disagree with the code.

| You changed… | Update… |
|---|---|
| Added or changed an API route, its body or its errors | `docs/api.md` |
| Changed `schema.prisma` or added a migration | `docs/data-model.md` (columns, constraints, indexes and the ER diagram) |
| Added an env var, script, dependency or setup step | `README.md` → *Getting started*, and `.env.example` |
| Finished or dropped a requirement | `docs/requirements.md` → *Status* |
| Changed seed users or passwords | `README.md` → *Demo logins* |
| Found a bug you won't fix today | `README.md` → *Known limitations* |

A docs-only change uses the `docs` type: `docs(api): document review endpoint errors`.

## 3. Writing style

- **Plain, short, direct English.** Use active voice and the present tense: "The server validates the amount", not "The amount will be validated".
- **The reader runs commands; they don't interpret them.** Give every command its own code block, copy-pasteable and in the order it should be run.
- **Use the problem statement's words** for entities and actions, the same words as in the code and the UI ([Naming Conventions §1](naming-conventions.md#1-general-rules)).
- **Use tables** for anything with repeated fields (routes, env vars, requirements) and **numbered lists** for steps.
- **Link instead of repeating.** If something is explained in another doc, link to its section.
- Use sentence-case headings. No emojis in docs or commit messages.
- Every doc (except the README) starts with the small metadata table: version, owner, last updated, related documents.
- Write relative links (`docs/api.md`) so they work on GitHub.
- **No secrets**, real phone numbers or personal data in docs. Use `@demo.test` emails.

## 4. README structure

The README follows this order. The skeleton is already in [`README.md`](../README.md); fill it in rather than restructuring it.

1. **Title and one-line pitch**: what the app does and for whom.
2. **Problem statement**: the chosen problem in two or three sentences, linking to `docs/requirements.md`.
3. **Demo video**: the link, once it's submitted.
4. **Features**: a bullet list of what works, each tied to its `PS-n`.
5. **Screenshots**: three or four key screens (dashboard, main workflow, a form showing validation errors, mobile view), stored in `docs/screenshots/`.
6. **Tech stack**: a short table.
7. **Getting started**: prerequisites, then numbered copy-paste steps from `git clone` to the app in the browser. **Test them on a fresh clone at 4:45 PM.**
8. **Demo logins**: one per role.
9. **Project structure**: a short tree.
10. **API**: a link to `docs/api.md`.
11. **Known limitations**: an honest list. It shows judgement and stops the evaluator from treating known gaps as bugs.
12. **Team**: names, GitHub handles and what each person owned.

## 5. API documentation format

Each route in `docs/api.md` gets one entry in this form:

````markdown
### POST /api/payments

Record a payment against a confirmed invoice. **Auth:** Admin, Internal. Refs: PS-21.

**Body**

| Field | Type | Rules |
|---|---|---|
| `invoiceId` | number | An existing invoice |
| `method` | string | `CASH`, `BANK_TRANSFER`, `UPI`, `CARD` or `CHEQUE` |
| `amount` | number | Paise, above 0, at most the balance |
| `paymentDate` | string | `YYYY-MM-DD`, not in the future |
| `note` | string | Optional, at most 500 chars |

**Responses:** `201` the payment and updated invoice · `400` validation (`fields.amount`) · `403` not staff · `404` invoice not found · `409` the invoice is not `CONFIRMED`
````

## 6. Code-level documentation

Comments in code follow [Engineering Standards §5](engineering-standards.md#5-comments): a short overview at the top of each file, *why* comments, and `PS-n` tags on business rules.

## 7. Final documentation check (4:45 PM)

- [ ] The README *Getting started* steps work on a **fresh clone** (delete `node_modules`, `.env` and the database, then follow the steps exactly)
- [ ] Demo logins work
- [ ] Every `PS-n` in `requirements.md` has a final status
- [ ] `api.md` lists every route in `server/src/modules/`
- [ ] `data-model.md` matches the final schema
- [ ] Screenshots are current
- [ ] *Known limitations* is honest
- [ ] Team table filled in
- [ ] No secrets, `.env` files or local database files in the repo (`git ls-files | grep -E "\.env$"` prints nothing)
