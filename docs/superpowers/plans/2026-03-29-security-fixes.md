# Security Fixes — Implementation Plan

**Goal:** Fix all critical and high severity security issues identified in the audit.

**Scope:** 5 fixes across upload validation, server action auth, security headers, and URL sanitization.

---

## Fix 1: PDF Upload — Size Limit + Magic Byte Validation

**File:** `src/lib/actions/upload.ts`

- [ ] Add `MAX_PDF_BYTES = 25 * 1024 * 1024` constant (25 MB)
- [ ] Add size check before processing: `if (file.size > MAX_PDF_BYTES) return error`
- [ ] Add magic byte validation: read first 4 bytes, verify `%PDF` (`0x25 0x50 0x44 0x46`)
- [ ] Move the magic byte check BEFORE the Vercel Blob upload

```typescript
const MAX_PDF_BYTES = 25 * 1024 * 1024;

export async function uploadPdf(formData: FormData): Promise<ActionResult<{ url: string }>> {
  await requireAuth();
  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  // Size limit
  if (file.size > MAX_PDF_BYTES) {
    return { success: false, error: "File too large (max 25 MB)" };
  }

  // Magic byte validation (don't trust client MIME type)
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46) {
    return { success: false, error: "File does not appear to be a valid PDF" };
  }

  // ... existing upload logic
}
```

- [ ] Validate `deletePdf` URL: check that URL starts with expected Vercel Blob hostname or is a relative `/papers/` path

```typescript
export async function deletePdf(url: string): Promise<ActionResult> {
  await requireAuth();
  // Only allow deleting from our own blob store or local paths
  if (!url.includes(".public.blob.vercel-storage.com/") && !url.startsWith("/papers/")) {
    return { success: false, error: "Invalid blob URL" };
  }
  await del(url);
  return { success: true, data: undefined };
}
```

- [ ] Commit: `fix: add PDF size limit, magic byte validation, and blob URL check`

---

## Fix 2: Add Auth to Read-Only Server Actions

**Files:**
- `src/lib/actions/articles.ts` — `getArticles`, `getArticle`, `getErrata`
- `src/lib/actions/authors.ts` — `getAuthors`, `getAuthor`
- `src/lib/actions/courses.ts` — `getCourses`, `getCourse`
- `src/lib/actions/mentees.ts` — `getMentees`, `getMentee`
- `src/lib/actions/settings.ts` — `getSetting`

**Important distinction:** These functions are called from both admin pages (need auth) and server components that render admin pages (already behind admin layout auth). The `getPublished*` variants used by public pages are separate and do NOT need auth — they only return published content.

However, since any exported `"use server"` function is callable as a POST endpoint, the admin query functions must call `requireAuth()`.

- [ ] Add `await requireAuth()` as first line to: `getArticles`, `getArticle`, `getErrata`
- [ ] Add `await requireAuth()` as first line to: `getAuthors`, `getAuthor`
- [ ] Add `await requireAuth()` as first line to: `getCourses`, `getCourse`
- [ ] Add `await requireAuth()` as first line to: `getMentees`, `getMentee`
- [ ] `getSetting` is used by the public hero section — do NOT add auth. Instead, ensure it only returns non-sensitive keys. Add a key allowlist:

```typescript
const PUBLIC_SETTING_KEYS = ["hero_bio"] as const;

export async function getSetting(key: string): Promise<string | null> {
  if (!(PUBLIC_SETTING_KEYS as readonly string[]).includes(key)) {
    return null; // silently reject unknown keys
  }
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row?.value ?? null;
}
```

- [ ] Add key allowlist to `setSetting`:

```typescript
const WRITABLE_SETTING_KEYS = ["hero_bio"] as const;

export async function setSetting(key: string, value: string): Promise<ActionResult> {
  await requireAuth();
  if (!(WRITABLE_SETTING_KEYS as readonly string[]).includes(key)) {
    return { success: false, error: "Invalid setting key" };
  }
  // ... existing logic
}
```

- [ ] Commit: `fix: add auth to admin query actions, add settings key allowlist`

---

## Fix 3: Security Headers

**File:** `next.config.ts` (read existing file first)

- [ ] Add `headers()` function to Next.js config with:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - Basic `Content-Security-Policy`

```typescript
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }];
}
```

Note: Full CSP is deferred — the site uses inline styles (Tailwind), inline scripts (theme switcher), and KaTeX CSS from node_modules. A restrictive CSP would break functionality without careful nonce configuration. The four headers above provide meaningful protection without breakage risk.

- [ ] Commit: `fix: add security headers (X-Frame-Options, nosniff, referrer policy)`

---

## Fix 4: Sanitize pdfUrl Scheme

**File:** `src/lib/validators/article.ts`

- [ ] Replace the permissive `pdfUrl` validator with scheme validation:

```typescript
pdfUrl: z.string().min(1).refine(
  (val) => val.startsWith("/") || val.startsWith("https://") || val.startsWith("http://"),
  "PDF URL must be a relative path or http(s) URL"
).optional(),
```

**File:** `src/components/public/article-card.tsx`

- [ ] Add runtime guard in `getPdfUrl` to reject non-http(s) schemes:

```typescript
function getPdfUrl(article: Article): string | null {
  // ... existing logic to determine url ...
  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://")) {
    return url;
  }
  return null; // reject javascript:, data:, etc.
}
```

- [ ] Commit: `fix: validate pdfUrl scheme to prevent javascript: URI injection`

---

## Fix 5: Sanitize Error Messages

**Files:** `src/lib/actions/articles.ts`, `courses.ts`, `mentees.ts`

- [ ] Replace all `e instanceof Error ? e.message : "..."` patterns in catch blocks with generic messages:

```typescript
} catch (e) {
  console.error("[createArticle]", e);
  return { success: false, error: "Failed to create article. Please try again." };
}
```

Apply to all try/catch blocks in: `createArticle`, `updateArticle` (articles.ts), and equivalent functions in `courses.ts` and `mentees.ts`.

- [ ] Commit: `fix: replace raw DB error messages with generic user-facing messages`
