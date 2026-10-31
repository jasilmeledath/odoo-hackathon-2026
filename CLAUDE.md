# Instructions for AI assistants

Before writing or reviewing code in this repository, read:

1. [docs/engineering-standards.md](docs/engineering-standards.md): how code is written (stack, structure, validation, UI, API and database rules, definition of done)
2. [CONTRIBUTING.md](CONTRIBUTING.md): commit message format and Git workflow (feature branches into `develop`, and only `develop` into `main`)
3. [docs/naming-conventions.md](docs/naming-conventions.md) and [docs/documentation-rules.md](docs/documentation-rules.md)
4. [docs/requirements.md](docs/requirements.md): what is being built (`PS-n` IDs) and the decisions made
5. [docs/implementation-plan.md](docs/implementation-plan.md): tasks, billing design and build order
6. [docs/data-model.md](docs/data-model.md): the database design
7. [docs/journal/README.md](docs/journal/README.md) and the five newest entries in `docs/journal/`: required work history and recent context

Before each task, read `docs/engineering-standards.md`, `docs/journal/README.md`, the five newest journal entries, and any entries related to that task. Record every codebase or database change in a new journal entry in the same branch and pull request.

Use a Conventional Commit message for every commit, following `CONTRIBUTING.md` §3. Never bypass the commit-message hook.

Odoo weighs database design most, then coding standards, logic, modularity, frontend design, performance, scalability, security, usability and debugging skill. The database is local PostgreSQL. Do not add backend-as-a-service platforms or third-party APIs.

Key rules: keep rules in `<module>.service.js`, reuse the existing helpers and components, validate on client and server with per-field messages, use theme classes only, never hard-code data, update docs in the same commit, and write commit messages that pass `.githooks/commit-msg`. The developer committing your output must be able to explain every line, so keep changes small and readable.
