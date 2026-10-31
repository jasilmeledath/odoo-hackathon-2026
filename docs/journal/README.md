# Work Journal

This journal records repository and database work so teammates and coding agents can understand what changed, why, and what remains to be done.

## Required reading

Before every task, every team member and coding agent must read this file, the five newest journal entries, and entries related to the task. They must also read `docs/engineering-standards.md` and the relevant project instructions. This applies before coding, reviewing, changing documentation, or modifying the database.

## Recording work

- Add one numbered entry for each task that changes code, documentation, configuration, or the database.
- Add the entry in the same feature branch and pull request as the work. Do not wait until the end of the day.
- Use a Conventional Commit message for every commit, following `CONTRIBUTING.md` §3. Never bypass the commit-message hook.
- Keep entries append-only. Correct or clarify an earlier entry with a new entry that links back to it.
- Record the task or issue, contributor/agent, branch, summary of changes, important decisions, database/schema/migration impact, and checks performed with their outcomes. Include the PR link when available.
- State explicitly when a task made no database or schema change.
- Do not put passwords, tokens, secrets, customer personal data, or other sensitive values in the journal.
- Git commits remain the authoritative record of exact file changes; the journal provides concise context and decisions.

## Entry template

Create a new file named `YYYY-MM-DD-JNNN-short-topic.md` in this folder:

The uppercase `J` in journal filenames is an explicit exception to the general
lowercase kebab-case document filename rule; see [Naming Conventions §4](../naming-conventions.md#4-files-and-folders).

```markdown
# J-NNN: Short topic

- Date:
- Contributor/agent:
- Branch / issue / PR:
- Summary:
- Decisions:
- Database and migrations:
- Checks and results:
- Follow-ups:
```

Use the next available `J-NNN` number. For work that is still under review, mark the PR as pending and add its link when opened.
