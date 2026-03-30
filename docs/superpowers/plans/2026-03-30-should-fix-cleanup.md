# Should-Fix Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address 5 post-audit quality issues that are not blocking deployment but improve correctness and remove dead code.

**Architecture:** All changes are edits to existing files. No new files, no schema changes, no new dependencies.

**Tech Stack:** Next.js 16, Drizzle ORM, Zod

---

## File Map

| File | Change |
|------|--------|
| `src/lib/actions/fetch-metadata.ts` | Refactor `matchAuthors` to do lookups in-memory instead of 2N DB queries |
| `src/components/public/article-card.tsx` | Wrap async errata map in `Promise.all` |
| `src/lib/actions/articles.ts` | Add `z.string().uuid()` validation to `softDeleteArticle`, `restoreArticle`, `toggleArticleStatus`; remove dead `getPublished*` functions |
| `src/lib/actions/courses.ts` | Add `z.string().uuid()` validation to `softDeleteCourse`, `restoreCourse`, `toggleCourseStatus`; add `isNotNull(deletedAt)` guard to `restoreCourse` |
| `src/lib/actions/mentees.ts` | Add `z.string().uuid()` validation to `softDeleteMentee`, `restoreMentee`, `toggleMenteeStatus`; add `isNotNull(deletedAt)` guard to `restoreMentee` |
| `src/lib/actions/upload.ts` | Add `z.string().min(1)` validation to `deletePdf` |

---

### Task 1: Refactor matchAuthors to use in-memory lookups

**Files:**
- Modify: `src/lib/actions/fetch-metadata.ts:82-138`

Currently `matchAuthors` already fetches all authors into `allAuthors` (line 93) for the unmatched-candidates fallback, but then does individual DB queries for each author by ORCID (line 102-108) and by name (line 113-119) — that's up to 2 queries per author on top of the bulk fetch.

Since `allAuthors` already has everything, do all lookups against that array in-memory.

- [ ] **Step 1: Rewrite matchAuthors to use in-memory lookups**

Replace lines 88-128 with:

```ts
try {
    const matched: MatchResult["matched"] = [];
    const unmatched: MatchResult["unmatched"] = [];

    const allAuthors = await db.select().from(authors);

    // Build lookup maps for O(1) matching
    const byOrcid = new Map<string, Author>();
    const byNameLower = new Map<string, Author>();
    for (const a of allAuthors) {
      if (a.orcid) byOrcid.set(a.orcid, a);
      byNameLower.set(a.name.toLowerCase(), a);
    }

    for (let i = 0; i < fetchedNames.length; i++) {
      const name = fetchedNames[i];
      const orcid = fetchedOrcids[i];

      // (a) Try ORCID match first
      const found = (orcid && byOrcid.get(orcid)) || byNameLower.get(name.toLowerCase());

      if (found) {
        matched.push({ fetchedName: name, author: found });
      } else {
        // No exact match — return all authors as candidates for the UI
        unmatched.push({ fetchedName: name, candidates: allAuthors });
      }
    }

    return { success: true, data: { matched, unmatched } };
```

This reduces the function from 1 + 2N queries to exactly 1 query.

- [ ] **Step 2: Verify build compiles**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/fetch-metadata.ts
git commit -m "perf: matchAuthors uses in-memory lookups instead of 2N DB queries"
```

---

### Task 2: Wrap async errata map in Promise.all

**Files:**
- Modify: `src/components/public/article-card.tsx:191-202`

Currently the errata rendering uses `{errata?.map(async (erratum) => { ... })}`, which produces an array of Promises. The correct pattern is `Promise.all` to make the intent explicit and allow parallel resolution.

**Important:** `await` cannot appear inline inside a JSX expression — it's a syntax error. The `Promise.all` must be moved into the component body before the `return` statement.

- [ ] **Step 1: Move errata rendering to component body**

In the `ArticleCard` component body (before the `return` statement), add:

```tsx
  const renderedErrata = errata
    ? await Promise.all(
        errata.map(async (erratum) => {
          const renderedErratumAbstract = erratum.abstract
            ? await renderMath(erratum.abstract)
            : undefined;
          return (
            <ErratumBadge
              key={erratum.id}
              erratum={erratum}
              renderedAbstract={renderedErratumAbstract}
            />
          );
        })
      )
    : null;
```

Then replace lines 190-202 in the JSX:

```tsx
      {/* Errata */}
      {errata?.map(async (erratum) => {
        const renderedErratumAbstract = erratum.abstract
          ? await renderMath(erratum.abstract)
          : undefined;
        return (
          <ErratumBadge
            key={erratum.id}
            erratum={erratum}
            renderedAbstract={renderedErratumAbstract}
          />
        );
      })}
```

With simply:

```tsx
      {/* Errata */}
      {renderedErrata}
```

Note: The component function (`ArticleCard`) is already `async` (it uses `await renderMath` at the top level). The `await Promise.all(...)` in the component body ensures all errata render in parallel and produces a resolved JSX array.

- [ ] **Step 2: Verify build compiles**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/public/article-card.tsx
git commit -m "fix: wrap async errata map in Promise.all for explicit parallel resolution"
```

---

### Task 3: Add UUID validation to mutation id parameters

**Files:**
- Modify: `src/lib/actions/articles.ts` — `softDeleteArticle`, `restoreArticle`, `toggleArticleStatus`
- Modify: `src/lib/actions/courses.ts` — `softDeleteCourse`, `restoreCourse`, `toggleCourseStatus`
- Modify: `src/lib/actions/mentees.ts` — `softDeleteMentee`, `restoreMentee`, `toggleMenteeStatus`
- Modify: `src/lib/actions/upload.ts` — `deletePdf`

All these functions accept a string `id` parameter that goes directly into a DB query. If a non-UUID string is passed, the DB will throw a Postgres error. Adding a Zod UUID check at the top provides a clean, early error message.

The pattern for each function is to add this at the top (after `requireAuth()`):

```ts
const parsed = z.string().uuid().safeParse(id);
if (!parsed.success) {
  return { success: false, error: "Invalid ID" };
}
```

For `deletePdf`, the parameter is `url` (not a UUID), so validate with:

```ts
const parsed = z.string().min(1).safeParse(url);
if (!parsed.success) {
  return { success: false, error: "Invalid URL" };
}
```

- [ ] **Step 1: Add `z` import to articles.ts, courses.ts, mentees.ts, upload.ts**

Add `import { z } from "zod";` to each file's imports. Check if already present — none currently import Zod directly (they delegate to validator schemas).

- [ ] **Step 2: Add UUID validation to articles.ts mutations**

Add the validation block to `softDeleteArticle`, `restoreArticle`, and `toggleArticleStatus` — immediately after `await requireAuth()` and before the `try {`:

```ts
export async function softDeleteArticle(id: string): Promise<ActionResult> {
  await requireAuth();

  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return { success: false, error: "Invalid ID" };
  }

  try {
    // ... existing code
```

Apply the same pattern to `restoreArticle` and `toggleArticleStatus`.

- [ ] **Step 3: Add UUID validation to courses.ts mutations**

Same pattern for `softDeleteCourse`, `restoreCourse`, `toggleCourseStatus`.

- [ ] **Step 4: Add UUID validation to mentees.ts mutations**

Same pattern for `softDeleteMentee`, `restoreMentee`, `toggleMenteeStatus`.

- [ ] **Step 5: Add URL validation to upload.ts deletePdf**

Add after `await requireAuth()`:

```ts
const parsed = z.string().min(1).safeParse(url);
if (!parsed.success) {
  return { success: false, error: "Invalid URL" };
}
```

- [ ] **Step 6: Verify build compiles**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 7: Commit**

```bash
git add src/lib/actions/articles.ts src/lib/actions/courses.ts src/lib/actions/mentees.ts src/lib/actions/upload.ts
git commit -m "fix: validate mutation id params as UUID format, url as non-empty"
```

---

### Task 4: Add isNotNull(deletedAt) guard to restoreCourse and restoreMentee

**Files:**
- Modify: `src/lib/actions/courses.ts:138-169` — `restoreCourse`
- Modify: `src/lib/actions/mentees.ts:139-170` — `restoreMentee`

Currently `restoreCourse` and `restoreMentee` will happily "restore" a record that isn't deleted — setting `deletedAt` to null on an already-null field. The WHERE clause should guard against this with `isNotNull(deletedAt)`, mirroring how `softDelete*` guards with `isNull(deletedAt)`.

Note: `restoreArticle` already has this guard — it checks `if (!article || !article.deletedAt)` at the application level. Courses and mentees use a different pattern (returning-based), so the guard goes in the WHERE clause.

- [ ] **Step 1: Add isNotNull guard to restoreCourse**

Change the WHERE clause from:
```ts
.where(eq(courses.id, id))
```
to:
```ts
.where(and(eq(courses.id, id), isNotNull(courses.deletedAt)))
```

`and` and `isNotNull` are already imported in `courses.ts`.

- [ ] **Step 2: Add isNotNull guard to restoreMentee + fix error message**

Same WHERE clause change:
```ts
.where(and(eq(mentees.id, id), isNotNull(mentees.deletedAt)))
```

Also update the error message from `"Mentee not found"` to `"Mentee not found or not deleted"` to match the `restoreCourse` pattern and accurately describe both failure conditions.

`and` and `isNotNull` are already imported in `mentees.ts`.

- [ ] **Step 3: Verify build compiles**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/courses.ts src/lib/actions/mentees.ts
git commit -m "fix: guard restoreCourse/restoreMentee against restoring non-deleted records"
```

---

### Task 5: Remove dead getPublished* functions

**Files:**
- Modify: `src/lib/actions/articles.ts:359-406`

Three exported functions are dead code — never imported anywhere outside the file:
- `getPublishedArticles()` (lines 359-376)
- `getPublishedLectureNotes()` (lines 378-393)
- `getPublishedErrata()` (lines 395-406)

The public pages (`page.tsx`, `publications/page.tsx`) each define their own `unstable_cache`-wrapped queries inline. These server-action exports serve no purpose.

- [ ] **Step 1: Verify no imports exist**

Search for any imports of these functions across the codebase (excluding docs/plans):

```bash
grep -r "getPublishedArticles\|getPublishedErrata\|getPublishedLectureNotes" src/
```

Expected: only the definitions in `articles.ts` match.

- [ ] **Step 2: Remove the three functions**

Delete lines 359-406 (from `export async function getPublishedArticles()` through the end of `getPublishedErrata()`). Also remove the section separator comment above them if present.

- [ ] **Step 3: Clean up unused imports**

After removing these functions, check if any imports in `articles.ts` are now unused. Specifically:
- `isNotNull` — check if still used elsewhere in the file
- `desc` — check if still used (yes, used in `getArticles`)

- [ ] **Step 4: Verify build compiles**

Run: `npx next build 2>&1 | tail -20`

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/articles.ts
git commit -m "chore: remove dead getPublished* functions (pages query DB directly)"
```

---

## Verification

After all 5 tasks, run a full build to confirm no regressions:

```bash
npx next build
```
