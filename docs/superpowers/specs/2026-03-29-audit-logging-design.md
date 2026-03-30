# Admin Audit Logging — Design Spec

## Overview

Add an audit log that records all admin data mutations and logins, with full before/after snapshots to enable manual reversal.

## Schema

### audit_log table

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, default random |
| `action` | text | `create`, `update`, `delete`, `restore`, `toggle_status`, `login`, `upload_pdf`, `delete_pdf` |
| `entityType` | text (nullable) | `article`, `author`, `course`, `mentee`, `setting`, `pdf`, null for login |
| `entityId` | text (nullable) | UUID or key of affected row, null for login |
| `before` | jsonb (nullable) | Full row snapshot before change (serialized via toJsonb), null for create/login/upload |
| `after` | jsonb (nullable) | Full row snapshot after change (serialized via toJsonb), null for delete/login |
| `userLogin` | text | GitHub username |
| `ipAddress` | text (nullable) | Client IP, captured for logins only |
| `createdAt` | timestamp | Immutable — no updatedAt |

**Indexes:**
- `(action, createdAt DESC)` — login history query
- `(entityType, entityId)` — entity change lookup
- `createdAt DESC` — general time queries

## Implementation details

### toJsonb helper

Drizzle returns `Date` objects that don't serialize correctly to JSONB. All snapshots must pass through:

```typescript
function toJsonb(row: unknown): unknown {
  return JSON.parse(JSON.stringify(row));
}
```

### Resolved references in snapshots

For articles, the `authorIds` UUID array is supplemented with a `_resolved` field containing human-readable author names at log time:

```json
{
  "authorIds": ["abc-123"],
  "_resolved": { "authors": [{ "id": "abc-123", "name": "Jane Smith" }] }
}
```

### logAudit helper

Best-effort: never blocks the main operation. Always `await`ed with `.catch()` to ensure the write completes before serverless freeze but never propagates errors:

```typescript
await logAudit({ action, entityType, entityId, before, after, userLogin }).catch(err => console.error("[audit]", err));
```

### Before-snapshot strategy

- **create**: `before` = null, `after` = new row
- **update**: fetch full row before mutation, store as `before`, fetch after for `after`
- **delete/softDelete**: fetch full row before, store as `before`, `after` = row with deletedAt set
- **restore**: fetch full row before (with deletedAt), store as `before`, `after` = restored row
- **toggleStatus**: reuse the already-fetched row as `before`
- **login**: both null
- **upload_pdf**: `before` = null, `after` = `{ url, filename }`
- **delete_pdf**: `before` = `{ url }`, `after` = null

### IP address capture for logins

NextAuth v5 `signIn` event does not provide the request object. IP is captured via custom route handler wrapper in `src/app/api/auth/[...nextauth]/route.ts` that reads `x-forwarded-for` header before delegating to NextAuth, and passes it through via a module-level variable or AsyncLocalStorage.

### What gets logged

All mutating server actions in: articles.ts, authors.ts, courses.ts, mentees.ts, settings.ts, upload.ts. Metadata fetch actions (fetchArxiv, fetchDoi, fetchAuthorMetadata) are NOT logged — they are read-only.

### Login history UI

Last 10 login entries shown on `/admin/settings` page below the Hero Bio editor. Query: `WHERE action = 'login' ORDER BY createdAt DESC LIMIT 10`.

### Retention

365 days for data changes, 90 days for login entries. Cleanup via a scheduled job (Vercel Cron or manual periodic DELETE).

### Reversal workflow (manual, no UI)

1. Query audit_log for the entity
2. Take the `before` JSONB snapshot
3. Restore via Drizzle Studio or manual update
