# Pre-Deploy Must-Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 audit-identified issues before production deployment

**Architecture:** All changes are surgical edits to existing files. No new files, no schema changes, no new dependencies.

**Tech Stack:** Next.js 16, Drizzle ORM, NextAuth v5, Vercel Blob

---

## File Map

| File | Change |
|------|--------|
| `src/lib/actions/articles.ts` | Wrap `softDeleteArticle`, `restoreArticle`, `toggleArticleStatus` in try/catch |
| `src/lib/actions/courses.ts` | Wrap `softDeleteCourse`, `restoreCourse`, `toggleCourseStatus` in try/catch; add `isNull(deletedAt)` guard to `softDeleteCourse` |
| `src/lib/actions/mentees.ts` | Wrap `softDeleteMentee`, `restoreMentee`, `toggleMenteeStatus` in try/catch; add `isNull(deletedAt)` guard to `softDeleteMentee` |
| `src/lib/actions/upload.ts` | Fix `deletePdf` to skip `del()` for `/papers/` paths; move audit log after operation |
| `src/app/robots.ts` | Add `disallow: "/admin"` |
| `src/app/admin/layout.tsx` | Add username check via `requireAuth()` |
| `src/app/(public)/publications/page.tsx` | Add `publishedDay` to ORDER BY |

---

### Task 1: Wrap article actions in try/catch

**Files:**
- Modify: `src/lib/actions/articles.ts:173-311`

The existing `createArticle` and `updateArticle` functions already follow a consistent try/catch pattern:
```ts
try {
  // ... db operations + audit ...
  return { success: true, data: ... };
} catch (e) {
  console.error("[functionName]", e);
  return { success: false, error: "Failed to ... Please try again." };
}
```

Apply this same pattern to `softDeleteArticle`, `restoreArticle`, and `toggleArticleStatus`.

- [ ] **Step 1: Wrap `softDeleteArticle` in try/catch**

Wrap the body after `await requireAuth()` (lines 176-212) in try/catch:

```ts
export async function softDeleteArticle(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const [beforeRow] = await db.select().from(articles).where(eq(articles.id, id));

    const now = new Date();

    const result = await db
      .update(articles)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(articles.id, id), isNull(articles.deletedAt)))
      .returning({ id: articles.id });

    if (result.length === 0) {
      return { success: false, error: "Article not found or already deleted" };
    }

    await db
      .update(articles)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          eq(articles.parentId, id),
          isNull(articles.deletedAt)
        )
      );

    const [afterRow] = await db.select().from(articles).where(eq(articles.id, id));
    await logAudit({
      action: "delete",
      entityType: "article",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("articles");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[softDeleteArticle]", e);
    return { success: false, error: "Failed to delete article. Please try again." };
  }
}
```

- [ ] **Step 2: Wrap `restoreArticle` in try/catch**

Wrap the body after `await requireAuth()` (lines 218-276) in try/catch:

```ts
export async function restoreArticle(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const [article] = await db
      .select({
        id: articles.id,
        type: articles.type,
        parentId: articles.parentId,
        deletedAt: articles.deletedAt,
      })
      .from(articles)
      .where(eq(articles.id, id));

    if (!article || !article.deletedAt) {
      return { success: false, error: "Article not found or not deleted" };
    }

    if (article.type === "erratum" && article.parentId) {
      const [parent] = await db
        .select({ id: articles.id, deletedAt: articles.deletedAt })
        .from(articles)
        .where(eq(articles.id, article.parentId));
      if (parent && parent.deletedAt) {
        return {
          success: false,
          error: "Cannot restore erratum: parent article is in trash",
        };
      }
    }

    const deletedAt = article.deletedAt;

    await db
      .update(articles)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(articles.id, id));

    await db
      .update(articles)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(
        and(
          eq(articles.parentId, id),
          eq(articles.deletedAt, deletedAt)
        )
      );

    const [afterRow] = await db.select().from(articles).where(eq(articles.id, id));
    await logAudit({
      action: "restore",
      entityType: "article",
      entityId: id,
      before: article,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("articles");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[restoreArticle]", e);
    return { success: false, error: "Failed to restore article. Please try again." };
  }
}
```

- [ ] **Step 3: Wrap `toggleArticleStatus` in try/catch**

Wrap the body after `await requireAuth()` (lines 283-310) in try/catch:

```ts
export async function toggleArticleStatus(
  id: string
): Promise<ActionResult> {
  await requireAuth();

  try {
    const [article] = await db
      .select({ id: articles.id, status: articles.status })
      .from(articles)
      .where(eq(articles.id, id));

    if (!article) {
      return { success: false, error: "Article not found" };
    }

    const newStatus = article.status === "draft" ? "published" : "draft";

    await db
      .update(articles)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(articles.id, id));

    const [afterRow] = await db.select().from(articles).where(eq(articles.id, id));
    await logAudit({
      action: "toggle_status",
      entityType: "article",
      entityId: id,
      before: article,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("articles");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[toggleArticleStatus]", e);
    return { success: false, error: "Failed to toggle article status. Please try again." };
  }
}
```

- [ ] **Step 4: Verify build compiles**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/articles.ts
git commit -m "fix: wrap article soft-delete/restore/toggle in try/catch"
```

---

### Task 2: Wrap course and mentee actions in try/catch + add isNull guard

**Files:**
- Modify: `src/lib/actions/courses.ts:103-190`
- Modify: `src/lib/actions/mentees.ts:104-190`

Two issues addressed here:
1. Same missing try/catch as Task 1 (applies to `softDeleteCourse`, `restoreCourse`, `toggleCourseStatus`, `softDeleteMentee`, `restoreMentee`, `toggleMenteeStatus`)
2. `softDeleteCourse` and `softDeleteMentee` currently lack an `isNull(deletedAt)` guard in their WHERE clause, meaning already-deleted rows can be re-deleted (overwriting the original `deletedAt` timestamp and losing audit trail). `softDeleteArticle` already has this guard — courses and mentees should match.

- [ ] **Step 1: Fix `softDeleteCourse` — add isNull guard + try/catch**

The current WHERE clause at line 113 is:
```ts
.where(eq(courses.id, id))
```

Change to match the article pattern:
```ts
.where(and(eq(courses.id, id), isNull(courses.deletedAt)))
```

Also requires adding `and` to the imports from `drizzle-orm` (`isNull` is already imported in both files).

**Update the import line** in `courses.ts` (line 3) from:
```ts
import { eq, isNull, isNotNull, sql } from "drizzle-orm";
```
to:
```ts
import { eq, and, isNull, isNotNull, sql } from "drizzle-orm";
```

Full function with try/catch:

```ts
export async function softDeleteCourse(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const [beforeRow] = await db.select().from(courses).where(eq(courses.id, id));

    const now = new Date();

    const result = await db
      .update(courses)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(courses.id, id), isNull(courses.deletedAt)))
      .returning({ id: courses.id });

    if (result.length === 0) {
      return { success: false, error: "Course not found or already deleted" };
    }

    const [afterRow] = await db.select().from(courses).where(eq(courses.id, id));
    await logAudit({
      action: "delete",
      entityType: "course",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[softDeleteCourse]", e);
    return { success: false, error: "Failed to delete course. Please try again." };
  }
}
```

- [ ] **Step 2: Wrap `restoreCourse` and `toggleCourseStatus` in try/catch**

Same pattern as Step 1 (try/catch wrapping the body after `requireAuth()`). Error messages:
- `restoreCourse`: `"Failed to restore course. Please try again."`
- `toggleCourseStatus`: `"Failed to toggle course status. Please try again."`

- [ ] **Step 3: Fix `softDeleteMentee` — add isNull guard + try/catch**

Same change as Step 1 but for mentees.

**Update the import line** in `mentees.ts` (line 3) from:
```ts
import { eq, isNull, isNotNull, sql } from "drizzle-orm";
```
to:
```ts
import { eq, and, isNull, isNotNull, sql } from "drizzle-orm";
```

Update the WHERE clause:
```ts
.where(and(eq(mentees.id, id), isNull(mentees.deletedAt)))
```

Full function with try/catch:

```ts
export async function softDeleteMentee(id: string): Promise<ActionResult> {
  await requireAuth();

  try {
    const [beforeRow] = await db.select().from(mentees).where(eq(mentees.id, id));

    const now = new Date();

    const result = await db
      .update(mentees)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(mentees.id, id), isNull(mentees.deletedAt)))
      .returning({ id: mentees.id });

    if (result.length === 0) {
      return { success: false, error: "Mentee not found or already deleted" };
    }

    const [afterRow] = await db.select().from(mentees).where(eq(mentees.id, id));
    await logAudit({
      action: "delete",
      entityType: "mentee",
      entityId: id,
      before: beforeRow,
      after: afterRow,
    }).catch((err) => console.error("[audit]", err));

    revalidateTag("academic");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[softDeleteMentee]", e);
    return { success: false, error: "Failed to delete mentee. Please try again." };
  }
}
```

- [ ] **Step 4: Wrap `restoreMentee` and `toggleMenteeStatus` in try/catch**

Same pattern. Error messages:
- `restoreMentee`: `"Failed to restore mentee. Please try again."`
- `toggleMenteeStatus`: `"Failed to toggle mentee status. Please try again."`

- [ ] **Step 5: Verify imports**

Confirm that `and` was added to the import line in both `courses.ts` and `mentees.ts` (done in Steps 1 and 3 above). `isNull` and `isNotNull` are already present in both files.

- [ ] **Step 6: Verify build compiles**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 7: Commit**

```bash
git add src/lib/actions/courses.ts src/lib/actions/mentees.ts
git commit -m "fix: wrap course/mentee actions in try/catch, add isNull guard to soft-delete"
```

---

### Task 3: Fix deletePdf — skip del() for local paths, move audit after operation

**Files:**
- Modify: `src/lib/actions/upload.ts:48-74`

Two issues:
1. When `url` starts with `/papers/`, `del(url)` is called on a non-Blob URL. The Vercel Blob SDK's `del()` will either throw or silently fail. Local `/papers/` paths are static files that can't be deleted via Blob SDK — the function should return success without calling `del()`.
2. The audit log is written *before* the `del()` call. If `del()` fails, we've logged a deletion that didn't happen. Move audit after the operation.

- [ ] **Step 1: Rewrite `deletePdf`**

```ts
export async function deletePdf(url: string): Promise<ActionResult> {
  await requireAuth();

  if (url.startsWith("/papers/")) {
    // Static local file — nothing to delete from Blob storage.
    // No audit log needed: no actual deletion occurred.
    return { success: true, data: undefined };
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
      return { success: false, error: "Invalid blob URL" };
    }
  } catch {
    return { success: false, error: "Invalid blob URL" };
  }

  try {
    await del(url);

    await logAudit({
      action: "delete_pdf",
      entityType: "pdf",
      entityId: url,
      before: { url },
    }).catch((err) => console.error("[audit]", err));

    return { success: true, data: undefined };
  } catch (e) {
    console.error("[deletePdf]", e);
    return { success: false, error: "Failed to delete PDF. Please try again." };
  }
}
```

Key changes:
- `/papers/` paths return immediately without calling `del()`
- `del()` is wrapped in try/catch
- Audit log is written *after* successful `del()` call

- [ ] **Step 2: Verify build compiles**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/upload.ts
git commit -m "fix: deletePdf skips del() for local paths, audit after operation"
```

---

### Task 4: Add disallow /admin to robots.ts

**Files:**
- Modify: `src/app/robots.ts`

Currently the robots.txt allows all paths. Admin routes should be explicitly disallowed to prevent search engines from indexing them (even though they require auth, the URLs shouldn't appear in search results).

- [ ] **Step 1: Add disallow rule**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: "https://kslutsky.com/sitemap.xml",
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/robots.ts
git commit -m "fix: disallow /admin in robots.txt"
```

---

### Task 5: Add username check to admin layout (defense-in-depth)

**Files:**
- Modify: `src/app/admin/layout.tsx`

Currently the admin layout only checks for session existence. Middleware already checks the username, but defense-in-depth means the layout should also verify the username matches — if middleware is ever bypassed or misconfigured, the layout catches it.

Replace `auth()` with `requireAuth()` which already checks both session existence AND username match.

**Important:** Next.js 16 docs require that `redirect()` be called outside try/catch blocks (it throws internally). Use `.catch(() => null)` pattern instead. The redirect target should be `/auth/signout` to match the middleware's behavior for wrong-username cases (the middleware at `src/middleware.ts` redirects wrong-account users to `/auth/signout`, not `/api/auth/signin`).

- [ ] **Step 1: Switch to requireAuth()**

```ts
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import ViewportWarning from "@/components/admin/viewport-warning";
import Sidebar from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    redirect("/auth/signout");
  }

  return (
    <div className="flex h-screen">
      <ViewportWarning />
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">{children}</main>
    </div>
  );
}
```

Note: `requireAuth()` throws on failure (no session or wrong username). Using `.catch(() => null)` converts the throw to a null return, then `redirect()` is called outside any try/catch as required by Next.js 16. Redirect target is `/auth/signout` to match middleware behavior.

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "fix: admin layout checks username via requireAuth (defense-in-depth)"
```

---

### Task 6: Add publishedDay to ORDER BY in publications page

**Files:**
- Modify: `src/app/(public)/publications/page.tsx:20-24`

Currently the ORDER BY is:
```ts
.orderBy(
  sql`${articles.publishedYear} DESC NULLS LAST`,
  sql`${articles.publishedMonth} DESC NULLS LAST`,
  desc(articles.createdAt)
)
```

Articles with the same year and month sort by `createdAt` (insertion time), not by `publishedDay`. Adding `publishedDay` as a tiebreaker gives the correct chronological sort.

- [ ] **Step 1: Add publishedDay to ORDER BY**

```ts
.orderBy(
  sql`${articles.publishedYear} DESC NULLS LAST`,
  sql`${articles.publishedMonth} DESC NULLS LAST`,
  sql`${articles.publishedDay} DESC NULLS LAST`,
  desc(articles.createdAt)
)
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(public)/publications/page.tsx
git commit -m "fix: add publishedDay to publications ORDER BY for correct sort"
```

---

## Verification

After all 6 tasks, run a full build to confirm no regressions:

```bash
npx next build
```
