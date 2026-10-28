# API Reference

| Field | Value |
|---|---|
| Version | 0.1 |
| Owner | Whoever adds or changes a route |
| Last updated | 29 October 2026 |
| Related documents | [Engineering Standards §6](engineering-standards.md#6-backend-and-api) · [Documentation Rules §5](documentation-rules.md#5-api-documentation-format) |

Base URL: `http://localhost:4000/api`. Every route except register, login and health needs `Authorization: Bearer <token>`.

**Error format** (every non-2xx response):

```json
{ "error": "Validation failed", "fields": { "email": "Enter a valid email address" } }
```

---

## Health

### GET /api/health

Liveness check. **Auth:** none.

**Responses:** `200` `{ "ok": true }`

<!-- Add one entry per route, grouped by module, in the format from
docs/documentation-rules.md §5. Add it in the same commit as the route. -->
