# Instructions for AI assistants

Before writing or reviewing code in this repository, read:

1. [docs/engineering-standards.md](docs/engineering-standards.md): how code is written (stack, structure, validation, UI, API and database rules, definition of done)
2. [CONTRIBUTING.md](CONTRIBUTING.md): commit message format and Git workflow (single `main` branch)
3. [docs/naming-conventions.md](docs/naming-conventions.md) and [docs/documentation-rules.md](docs/documentation-rules.md)
4. [docs/requirements.md](docs/requirements.md): what is being built (`PS-n` IDs)

Key rules: reuse the existing helpers and components, validate on client and server with per-field messages, use theme classes only, never hard-code data, update docs in the same commit, and write commit messages that pass `.githooks/commit-msg`. The developer committing your output must be able to explain every line, so keep changes small and readable.
