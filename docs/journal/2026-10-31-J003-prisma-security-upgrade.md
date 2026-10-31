# J-003: Upgrade Prisma to address dependency advisories

- Date: 2026-10-31
- Contributor/agent: Jayasurya Suryadas with Codex
- Branch / issue / PR: `fix/prisma-security-advisories`; [PR #53](https://github.com/jasilmeledath/odoo-hackathon-2026/pull/53), pending review
- Summary: Upgraded Prisma CLI and client to 7.10.1, added the PostgreSQL driver adapter, generated-client runtime loading, Prisma config, and setup documentation. Added Node/tsx runtime requirements and explicit client generation to setup commands.
- Decisions: Use the supported Prisma 7 configuration and adapter model instead of forcing an incompatible transitive dependency override.
- Database and migrations: No schema changes or new migration. Prisma schema syntax/configuration changed for v7, but table structure and existing migration SQL remain unchanged.
- Checks and results: `npm audit` reported 0 vulnerabilities; `prisma generate`, `prisma validate`, generated-client import smoke check, and `git diff --check` passed. A live PostgreSQL migration was not run.
- Follow-ups: Run the migration and app against a local PostgreSQL database during PR review; merge only after review.
