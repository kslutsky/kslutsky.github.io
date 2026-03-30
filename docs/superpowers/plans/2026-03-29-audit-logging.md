# Audit Logging — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Log all admin mutations and logins with full before/after snapshots for manual reversal.

**Spec:** `docs/superpowers/specs/2026-03-29-audit-logging-design.md`

---

## Task 1: Schema + Helpers

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `src/lib/audit.ts`

### Step 1: Add audit_log table to schema

```typescript
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    userLogin: text("user_login").notNull(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_action_created_idx").on(table.action, table.createdAt),
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
    index("audit_log_created_idx").on(table.createdAt),
  ]
);
```

### Step 2: Push schema

```bash
npx drizzle-kit push
```

### Step 3: Create `src/lib/audit.ts`

```typescript
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

function toJsonb(row: unknown): unknown {
  return JSON.parse(JSON.stringify(row));
}

interface AuditParams {
  action: string;
  entityType?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  userLogin?: string;
  ipAddress?: string;
  resolved?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  let login = params.userLogin;
  if (!login) {
    const session = await auth();
    login = (session?.user as { login?: string } | undefined)?.login ?? "unknown";
  }

  const beforeData = params.before
    ? { ...toJsonb(params.before) as object, ...(params.resolved ? { _resolved: params.resolved } : {}) }
    : null;

  const afterData = params.after
    ? { ...toJsonb(params.after) as object, ...(params.resolved ? { _resolved: params.resolved } : {}) }
    : null;

  await db.insert(auditLog).values({
    action: params.action,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
    before: beforeData,
    after: afterData,
    userLogin: login,
    ipAddress: params.ipAddress ?? null,
  });
}
```

### Step 4: Commit

```bash
git add -A
git commit -m "feat: add audit_log table and logAudit helper"
```

---

## Task 2: Add Logging to Article Actions

**File:** `src/lib/actions/articles.ts`

For each mutating action, add a `logAudit()` call. Read the file first.

Pattern for each action:

- **createArticle**: After successful insert, log with `before: null`, `after: newRow`. For articles, resolve author names into `_resolved`.
- **updateArticle**: Fetch full row BEFORE the update (add `const beforeRow = await db.select()...`). After update, fetch the updated row. Log both.
- **softDeleteArticle**: Fetch full row before setting deletedAt. After update, log both states.
- **restoreArticle**: The function already fetches the article — use that as `before`. After update, fetch the restored row for `after`.
- **toggleArticleStatus**: Already fetches the article to read status — use as `before`. After update, fetch for `after`.

All `logAudit()` calls use: `await logAudit({...}).catch(err => console.error("[audit]", err))`

For resolving author names, add a helper that takes authorIds and the db to look up names.

### Commit

```bash
git commit -m "feat: add audit logging to article actions"
```

---

## Task 3: Add Logging to Author, Course, Mentee, Settings Actions

**Files:**
- `src/lib/actions/authors.ts`
- `src/lib/actions/courses.ts`
- `src/lib/actions/mentees.ts`
- `src/lib/actions/settings.ts`

Same pattern as articles. For each create/update/delete:
- Fetch before row (where needed)
- Perform mutation
- `await logAudit({...}).catch(...)`

For `setSetting`: fetch the current value before upsert as `before`, new value as `after`. entityId = the setting key (text, not UUID).

### Commit

```bash
git commit -m "feat: add audit logging to author, course, mentee, and settings actions"
```

---

## Task 4: Add Logging to PDF Upload/Delete

**File:** `src/lib/actions/upload.ts`

- **uploadPdf**: After successful upload, log with `entityType: "pdf"`, `entityId: blob.url`, `before: null`, `after: { url: blob.url, filename: file.name }`.
- **deletePdf**: Log with `before: { url }`, `after: null`.

### Commit

```bash
git commit -m "feat: add audit logging to PDF upload/delete"
```

---

## Task 5: Login Logging via Custom Route Handler

**File:** `src/app/api/auth/[...nextauth]/route.ts`

The current file just re-exports handlers. Wrap the POST handler to capture IP and log after successful auth:

```typescript
import { handlers, auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const GET = handlers.GET;

export async function POST(request: Request) {
  // Capture IP before delegating to NextAuth
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") ?? null;

  const response = await handlers.POST(request);

  // After successful auth, check if this was a callback (login)
  const url = new URL(request.url);
  if (url.pathname.includes("/callback/")) {
    const session = await auth();
    const login = (session?.user as { login?: string } | undefined)?.login;
    if (login) {
      await logAudit({
        action: "login",
        userLogin: login,
        ipAddress: ip,
      }).catch(err => console.error("[audit:login]", err));
    }
  }

  return response;
}
```

### Commit

```bash
git commit -m "feat: log admin logins with IP address"
```

---

## Task 6: Login History on Settings Page

**Files:**
- Modify: `src/app/admin/settings/page.tsx`
- Modify: `src/components/admin/settings-form.tsx` (or add inline)

Add a "Recent Logins" section below the Hero Bio editor on the settings page.

Query: `SELECT * FROM audit_log WHERE action = 'login' ORDER BY created_at DESC LIMIT 10`

Display as a simple table:
| Date | User | IP |
|---|---|---|
| 2026-03-29 14:32 | kslutsky | 192.168.1.1 |

This is a server component query — no client component needed for display.

### Commit

```bash
git commit -m "feat: show recent login history on admin settings page"
```

---

## Verification

- `npx vitest run` — all tests pass
- `npm run dev` — create/edit an article, check audit_log table in Drizzle Studio
- Sign in, check login appears on settings page
- Upload a PDF, verify audit_log entry
