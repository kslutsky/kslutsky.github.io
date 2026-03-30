# Pre-Deployment Fixes — Implementation Plan

**Goal:** Fix 4 important code issues before Vercel deployment.

---

## Fix #7: Global Error Boundary

**Problem:** `src/app/error.tsx` is a segment-level error boundary. If the root layout itself fails (e.g., database connection error, import failure), this file won't catch it. Next.js requires `src/app/global-error.tsx` for that, and it must include its own `<html>` and `<body>` tags since the root layout won't render.

**Changes:**

1. Rename `src/app/error.tsx` to `src/app/global-error.tsx`
2. Wrap the content in `<html><body>...</body></html>`
3. Use hardcoded colors (not CSS variables) since the theme system may not load when the root layout fails
4. Keep the existing `error.tsx` as a copy for segment-level errors (where CSS variables DO work)

`src/app/global-error.tsx`:
```tsx
"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        backgroundColor: "#ffffff",
        color: "#1c1917",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "1.125rem", color: "#78716c" }}>
          Something went wrong.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={reset} style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            border: "1px solid #e7e5e4",
            backgroundColor: "#f0efed",
            color: "#1c1917",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}>Try again</button>
          <Link href="/" style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            backgroundColor: "#059669",
            color: "#ffffff",
            fontSize: "0.875rem",
            fontWeight: 500,
            textDecoration: "none",
          }}>Go home</Link>
        </div>
      </body>
    </html>
  );
}
```

`src/app/error.tsx` stays as-is (segment-level, uses CSS variables, no `<html>/<body>`).

**Commit:** `fix: add global-error.tsx for root layout failures`

---

## Fix #8: Wire CONTACT_EMAIL into Fetcher User-Agents

**Problem:** Hardcoded placeholder emails in API User-Agent strings will cause throttling by arXiv and CrossRef.

**Changes:**

1. `src/lib/fetchers/arxiv.ts` — find the `User-Agent` string (currently `"kslutsky-homepage/1.0 (https://kslutsky.github.io; mailto:kslutsky@example.com)"`). Replace with:
```typescript
`AcademicHomepage/1.0 (mailto:${process.env.CONTACT_EMAIL ?? "unknown"})`
```

2. `src/lib/fetchers/crossref.ts` — find the `User-Agent` string (currently has `mailto:admin@example.com` or similar). Replace with the same pattern.

3. `src/lib/fetchers/openalex.ts` — check if it also has a hardcoded email. If so, fix.

4. Update `.env.local.example` to document `CONTACT_EMAIL` is used for API User-Agent headers (it's already listed but the purpose isn't clear).

**Commit:** `fix: wire CONTACT_EMAIL into fetcher User-Agent headers`

---

## Fix #10: Add metadataBase to Root Layout

**Problem:** Without `metadataBase`, Next.js can't resolve relative URLs in metadata and emits a build warning. Open Graph images and canonical URLs won't work correctly.

**Changes:**

In `src/app/layout.tsx`, update the `metadata` export:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL("https://kslutsky.com"),
  title: "Konstantin Slutsky",
  description: "Assistant Professor at Iowa State University. Research in descriptive set theory, ergodic theory, and autonomous systems.",
  openGraph: {
    title: "Konstantin Slutsky",
    description: "Assistant Professor at Iowa State University. Research in descriptive set theory, ergodic theory, and autonomous systems.",
    url: "https://kslutsky.com",
    siteName: "Konstantin Slutsky",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
  icons: {
    icon: "/favicon.svg",
  },
};
```

This also covers item #14 (Open Graph / Twitter metadata) since we're touching the same code.

**Commit:** `feat: add metadataBase and Open Graph metadata`

---

## Fix #12: Add Cache Fallback TTL

**Problem:** `unstable_cache` calls have no time-based expiration. If `revalidateTag` is missed or fails, stale data persists indefinitely. Adding `revalidate: 3600` (1 hour) ensures self-healing.

**Changes:**

Find all `unstable_cache` calls and add `revalidate: 3600` to the options object:

1. `src/app/(public)/page.tsx` — `getPublishedData`:
```typescript
{ tags: ["articles"], revalidate: 3600 }
```

2. `src/app/(public)/page.tsx` — `getAcademicData`:
```typescript
{ tags: ["academic"], revalidate: 3600 }
```

3. `src/components/public/hero-section.tsx` — `getHeroBio`:
```typescript
{ tags: ["settings"], revalidate: 3600 }
```

4. `src/app/(public)/publications/page.tsx` — `getPublicationsData`:
```typescript
{ tags: ["articles"], revalidate: 3600 }
```

5. `src/app/(public)/teaching/page.tsx` — `getAllCourses`:
```typescript
{ tags: ["academic"], revalidate: 3600 }
```

Each is a one-line addition to the third argument of `unstable_cache`.

**Commit:** `fix: add 1-hour fallback TTL to all unstable_cache calls`

---

## Also: Update .env.local.example

Add `AUTH_TRUST_HOST` and `AUTH_URL` to the example file so they're documented for deployment:

```
AUTH_TRUST_HOST=true
AUTH_URL=https://kslutsky.com
```

**Commit:** `docs: add AUTH_TRUST_HOST and AUTH_URL to env example`
