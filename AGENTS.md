# Instructions for coding agents

Before starting every task, read:

1. [Engineering Standards](docs/engineering-standards.md)
2. [Work Journal instructions](docs/journal/README.md)
3. The five newest entries in `docs/journal/` and every entry related to the task
4. [Contributing](CONTRIBUTING.md), [Naming Conventions](docs/naming-conventions.md), and [Documentation Rules](docs/documentation-rules.md)
5. The relevant requirement, implementation plan, API reference, and data model

Record every task that changes code, documentation, configuration, or the database in a new append-only journal entry under `docs/journal/`. Add the entry in the same branch and pull request as the work. For database work, state the schema and migration impact explicitly. Never record secrets or personal data.

Use a Conventional Commit message for every commit, without exception, following [CONTRIBUTING.md §3](CONTRIBUTING.md#3-commit-messages). Do not bypass the commit-message hook.

`docs/engineering-standards.md` is the source of truth for implementation rules. When instructions conflict, follow that document and the precedence it defines.
