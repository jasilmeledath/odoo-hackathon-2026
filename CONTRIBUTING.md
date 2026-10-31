# Contributing

| Field | Value |
|---|---|
| Version | 1.1 |
| Owner | Team lead (Jasil M) |
| Last updated | 31 October 2026 |
| Applies to | Every commit and pull request in this repository, by every team member and every AI assistant |

This guide sets out how we commit, push and open pull requests during the Odoo x Make-A-Ton 9.0 virtual round. It is shaped by the organizers' rules:

> - Your latest code must be in the **`main` branch**, and all code should stay in a **single branch**.
> - Every member pushes **at least once every hour**.
> - **Every member commits their own code.** Individual commits are used to identify each member's contribution and directly affect the evaluation.
> - Commit messages must explain what was done.

A `commit-msg` hook checks commit messages automatically. See [§7](#7-one-time-setup).

---

## Contents

1. [Branching](#1-branching)
2. [Push cadence](#2-push-cadence)
3. [Commit messages](#3-commit-messages)
4. [Commit hygiene](#4-commit-hygiene)
5. [Pull requests](#5-pull-requests)
6. [Quick reference](#6-quick-reference)
7. [One-time setup](#7-one-time-setup)
8. [When things go wrong](#8-when-things-go-wrong)

---

## 1. Branching

**`main` is the only long-lived branch.** The evaluator reads `main`, and the organizers want all code in one branch.

| Workflow | When | Rules |
|---|---|---|
| **Direct to `main`** (default) | Almost every change | Small commits. Run `git pull --rebase` before every push, and keep `main` runnable. |
| **Short-lived branch + pull request** | A risky change (schema rewrite, auth rework, large refactor) or something you want reviewed first | Name it `<type>/<short-description>`, for example `feat/billing-run`. Merge it **within 60 minutes**, then **delete it**. |

- **No branches may exist at 4:30 PM, apart from `main`.** Everything is merged and deleted by then.
- Never force-push `main`. Don't rebase or amend commits that are already on `main`.

## 2. Push cadence

| Rule | Detail |
|---|---|
| Push **at least once every hour**, every member | Set a repeating 50-minute timer at 9:00 AM. The organizers use these pushes to track progress. |
| Commit **every 15–30 minutes** | Small commits are easier to review, revert and credit. |
| **Pull before you push** | `git pull --rebase origin main`, then `git push`. |
| A push never breaks `main` | The app must still start after your push. If your feature isn't finished, push it behind a route nobody links to yet, or keep it unused, rather than pushing broken code. |
| Author identity is real | `git config user.name` and `user.email` match your own GitHub account. No shared machines or accounts. Commits made under someone else's name count for them, not you. |

Lead checkpoints (`git log --since="1 hour ago" --format="%an"`): at 10, 11, 12, 1, 2, 3 and 4. Anyone who hasn't pushed in the last hour gets a ping.

---

## 3. Commit messages

We follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), plus the rules below. The evaluator reads `git log`, so every message must say **what** changed and **why** without anyone opening the code.

### 3.1 Format

```text
<type>(<scope>): <subject>

<body: why the change is needed>

- <what changed, one bullet per notable change>

<footer: trailers>
```

Example:

```text
feat(payments): record payments against confirmed invoices

The team had no way to mark money received, so invoices stayed
outstanding forever.

- Add POST /api/payments with method, amount, date and note
- Reject amounts above the invoice balance
- Mark the invoice paid when the balance reaches zero

Refs: PS-21
```

### 3.2 Type

| Type | Use for |
|---|---|
| `feat` | A new user-facing capability or behaviour |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting only (whitespace, Prettier). No change in behaviour |
| `refactor` | Restructuring code without changing behaviour |
| `perf` | A performance improvement |
| `test` | Adding or correcting tests only |
| `build` | Build system, packaging or dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance that fits no other type (repo config, scripts) |
| `revert` | Reverting an earlier commit |

### 3.3 Scope

The scope names the part of the system a commit changes. It is **required** for `feat`, `fix`, `refactor`, `perf` and `test`, and optional for other types. Use exactly one scope. If a change spans several, it probably belongs in several commits.

The allowed scopes are listed in [`.githooks/scopes`](.githooks/scopes), one per line. The hook reads that file.

| Group | Scopes |
|---|---|
| Apps | `client`, `server` |
| Cross-cutting | `auth`, `users`, `db` (schema, migrations, seed), `api` (contracts, middleware), `ui` (theme, shared components), `validation` |
| Repository | `deps`, `config`, `repo`, `readme` |
| Domain modules | `staff`, `customers`, `products`, `plans`, `taxes`, `terms`, `discounts`, `templates`, `subscriptions`, `billing`, `invoices`, `payments`, `portal`, `reports`, `dashboard` |

To add a scope, add a line to `.githooks/scopes` and to the table above in the same commit (`chore(repo): add bookings scope`).

### 3.4 Header rules

| Rule | Correct | Incorrect |
|---|---|---|
| Maximum 72 characters (aim for about 50) | `fix(auth): reject expired tokens` | A header that wraps in `git log --oneline` |
| Imperative mood: it completes "If applied, this commit will …" | `add`, `fix`, `remove`, `rename` | `added`, `fixes`, `updating` |
| First word lowercase (acronyms such as API and CSV may stay uppercase) | `add CSV export of filtered list` | `Add CSV export…` |
| No full stop at the end | `… for managers` | `… for managers.` |
| Describe the change, not the activity | `validate amount is positive` | `update`, `changes`, `final`, `done`, `wip` |
| Name the behaviour, not the file | `show field errors on signup form` | `edit AuthPage.jsx` |

### 3.5 Body rules

- **Required** for `feat` and `fix`. Optional for other types when the header says it all.
- Leave **one blank line** after the header.
- **Explain why first**: the problem, the requirement from the problem statement, or the context. The diff already shows *how*.
- Then list **what** changed, one bullet per notable change, each starting with an imperative verb.
- Mention anything a teammate must act on: "Run `npx prisma migrate dev` after pulling", or "New env var `MAIL_FROM`".
- Wrap lines at **72 characters**. The hook rejects lines over 100 characters, except URLs.
- Write in plain English. No emojis, and no references to private chats ("as discussed on WhatsApp").
- At hackathon pace, a one-line *why* and two or three bullets is enough. Don't write an essay.

### 3.6 Footer (trailers)

Trailers go at the end, after one blank line, one per line, in `Key: value` form.

| Trailer | When | Example |
|---|---|---|
| `Refs:` | The commit implements part of the problem statement (PS), or relates to an issue | `Refs: PS-2, #4` |
| `Closes:` | The commit completes a GitHub issue | `Closes: #4` |
| `BREAKING CHANGE:` | An API contract or the schema changes in a way teammates must adapt to | `BREAKING CHANGE: /api/plans now returns { items, total }` |
| `Co-authored-by:` | Someone else paired on the commit, or an AI assistant wrote part of it | `Co-authored-by: Name <email>` |

**Problem-statement references.** At 9:15 AM the team lead numbers the problem statement's requirements in [docs/requirements.md](docs/requirements.md) (`PS-1`, `PS-2`, …). Use those IDs in `Refs:` so each commit traces back to a requirement.

### 3.7 Breaking changes

Add `!` after the type or scope, **and** explain the break in a `BREAKING CHANGE:` trailer:

```text
feat(api)!: paginate every list endpoint

Unpaginated lists got slow once seed data grew past a few hundred
rows.

- Return { items, total, page, pages } from every GET list route
- Default to 10 rows per page, maximum 50

BREAKING CHANGE: list endpoints return an object, not an array.
```

### 3.8 Reverts

```text
revert: feat(invoices): add bulk confirm

This reverts commit 1a2b3c4d.

Bulk confirm skipped the draft-status check. It will come back once
the check is shared with single confirm.
```

### 3.9 More examples

```text
feat(db): add discount usage tracking

Discounts must stop when they run out, so usage has to be counted
and protected by the database.

- Add usage_limit and usage_count to discounts
- Add a check that usage never passes the limit

Refs: PS-19, PS-20
```

```text
fix(validation): reject negative amounts on the server

The client blocked negative amounts, but the API still accepted
them when called directly.

- Add a minimum to the payment schema
- Return the error under fields.amount

Refs: PS-3
```

```text
docs(readme): add setup steps and demo logins
```

```text
style(client): format pages with Prettier
```

```text
chore(deps): add zod for request validation
```

### 3.10 Messages we don't accept

| Message | Problem |
|---|---|
| `update` / `changes` / `final` / `done` / `wip` / `asdf` | Says nothing about the change |
| `Fixed bug` | No type or scope, past tense, and which bug? |
| `feat: stuff for login and dashboard and api` | Several changes in one commit, and vague |
| `feat(auth): Added login.` | Past tense, capitalised, full stop, no body |
| `fix(ui): fix` | The subject repeats the type and explains nothing |

---

## 4. Commit hygiene

1. **One logical change per commit.** A feature and its docs belong together. An unrelated refactor or a formatting pass doesn't.
2. **Commit your own work.** Don't commit a teammate's changes from your machine, and don't paste their code into your commit. If you paired, add a `Co-authored-by:` trailer.
3. **`main` always starts.** Run the app (or at least `npm run build` and the server start-up) before pushing.
4. **Never commit secrets**: `.env` files, API keys, database passwords or JWT secrets. Commit `.env.example` with placeholder values instead.
5. **Never commit generated output**: `node_modules/`, `dist/`, local database files (`*.db`), `.DS_Store`.
6. **Change code and docs together.** A schema, API or setup change updates the docs in the same commit (see [Documentation Rules](docs/documentation-rules.md)).
7. **Don't bypass the hook.** We don't use `git commit --no-verify`. If the hook rejects your message, fix the message.

---

## 5. Pull requests

Most work goes straight to `main` ([§1](#1-branching)). When you do open a pull request:

- **Title:** use the commit header format, `<type>(<scope>): <subject>`, at most 72 characters.
- **Description:** fill in [the template](.github/pull_request_template.md). Cover what changed, why (with `PS-n` IDs), how you tested it, whether it is AI-assisted, and any limitations.
- **Review:** one teammate approves. The reviewer runs the app with the branch checked out. Reviews happen **within 15 minutes** of being asked. If you can't make that, say so on the team chat.
- **Merge method:** **"Rebase and merge"**. It keeps every individual commit and its author on `main`, which matters because Odoo scores individual commits. Don't use "Squash and merge": it turns several people's commits into one.
- **After merging:** delete the branch straight away.
- **Size:** about 300 changed lines or fewer. Anything bigger is split.

---

## 6. Quick reference

```text
<type>(<scope>): <subject>          ≤ 72 chars, imperative, lowercase, no full stop
                                    (blank line)
Why the change is needed.           required for feat and fix
                                    (blank line)
- What changed                      one bullet per notable change
                                    (blank line)
Refs: PS-3                          trailers

types   feat fix docs style refactor perf test build ci chore revert
scopes  see .githooks/scopes (client server auth users db api ui
        validation deps config repo readme + domain modules)

loop    git pull --rebase origin main → commit → git push   (every ≤ 60 min)
```

---

## 7. One-time setup

Run these once in your clone:

```bash
git config user.name "Your Name"
```

```bash
git config user.email "the-email-on-your-github-account@example.com"
```

```bash
git config core.hooksPath .githooks
```

```bash
git config commit.template .gitmessage
```

```bash
git config pull.rebase true
```

- `user.name` and `user.email` make sure your commits are credited to you on GitHub.
- `core.hooksPath` turns on the `commit-msg` hook, which checks every message against this guide.
- `commit.template` pre-fills your editor with a template when you run `git commit` without `-m`.
- `pull.rebase` makes `git pull` rebase your local commits instead of creating merge commits.

To check a message without committing:

```bash
printf 'feat(auth): add login\n\nWhy.\n\n- What\n' > /tmp/msg && .githooks/commit-msg /tmp/msg && echo OK
```

---

## 8. When things go wrong

| Problem | Fix |
|---|---|
| `git push` rejected (non-fast-forward) | `git pull --rebase origin main`, resolve any conflicts, then `git push`. Never `--force`. |
| Rebase conflict | Edit the conflicted files, `git add <file>`, then `git rebase --continue`. If you're lost: `git rebase --abort` and ask the lead. |
| Hook rejected your message | Read the reasons it prints, fix the message and commit again. Your staged changes are still there. |
| Typo in the last commit message, **not pushed yet** | `git commit --amend` |
| Typo in a commit that's **already pushed** | Leave it. Don't rewrite `main`. |
| Committed a secret | Tell the lead **straight away**. Rotate the secret, then remove it in a new commit. |
| Broke `main` | Fix it right away, or `git revert <sha>` and push. Tell the team. |
