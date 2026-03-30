# Medium Priority Security Fixes — Implementation Plan

**Goal:** Fix 4 medium-severity security issues from the audit.

---

## Fix M-1: Re-verify GitHub username in requireAuth()

**Files:**
- `src/lib/auth.ts`

**Problem:** `requireAuth()` only checks session existence, not the allowed username. A changed `ALLOWED_GITHUB_USERNAME` env var or compromised session token bypasses the username restriction.

**Implementation:**

1. Add a `jwt` callback to the NextAuth config that persists `profile.login` (GitHub username) into the JWT token.
2. Add a `session` callback that copies the login from the token into the session object.
3. Update `requireAuth()` to compare `session.user.login` against `ALLOWED_GITHUB_USERNAME`.

```typescript
// In NextAuth config
callbacks: {
  async signIn({ profile }) {
    const allowed = process.env.ALLOWED_GITHUB_USERNAME;
    if (!allowed) return false;
    return profile?.login?.toLowerCase() === allowed.toLowerCase();
  },
  async jwt({ token, profile }) {
    if (profile) {
      token.login = (profile as { login?: string }).login;
    }
    return token;
  },
  async session({ session, token }) {
    if (token.login) {
      (session.user as { login?: string }).login = token.login as string;
    }
    return session;
  },
},
```

Then in `requireAuth()`:
```typescript
export async function requireAuth() {
  const session = await auth();
  const allowed = process.env.ALLOWED_GITHUB_USERNAME;
  if (!session || !allowed) throw new Error("Unauthorized");
  const login = (session.user as { login?: string } | undefined)?.login;
  if (!login || login.toLowerCase() !== allowed.toLowerCase()) {
    throw new Error("Unauthorized");
  }
  return session;
}
```

**Commit:** `fix: re-verify GitHub username in requireAuth()`

---

## Fix M-2: Add timeouts to external API fetchers

**Files:**
- `src/lib/fetchers/arxiv.ts`
- `src/lib/fetchers/crossref.ts`
- `src/lib/fetchers/openalex.ts`
- `src/lib/validators/article.ts` (max-length on arXiv ID and DOI)

**Problem:** No `AbortController` timeout on external API calls. A slow response hangs the serverless function. No input length limits on arXiv ID and DOI.

**Implementation:**

1. Create a shared helper:
```typescript
// In each fetcher, or in a shared utility
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}
```

2. Replace `fetch(url, { headers })` with `fetchWithTimeout(url, { headers })` in:
   - `arxiv.ts` — `fetchArxivMetadata`
   - `crossref.ts` — `fetchCrossRefMetadata`
   - `openalex.ts` — `fetchOpenAlexAuthor`

3. Add max-length to validators in `article.ts`:
   - `arxivId`: add `.max(50)` before the refine/regex
   - `doi`: change regex to also limit length: add `.max(150)`

**Commit:** `fix: add 10s timeout to external API calls, cap input lengths`

---

## Fix M-3: No rate limiting (DEFERRED)

**Decision:** Rate limiting requires an external service (Upstash KV, Vercel KV) which is not currently configured. GitHub OAuth already rate-limits at GitHub's end for the login flow. Server actions are auth-gated. The practical risk for a single-user admin site is low.

**Recommendation:** Defer until Vercel deployment. At that point, Vercel's built-in WAF (Pro tier) or an Upstash integration can be added. Document this as a known limitation.

---

## Fix M-4: getErrata returns soft-deleted errata

**Files:**
- `src/lib/actions/articles.ts`

**Problem:** `getErrata(parentId)` has no `deletedAt IS NULL` filter. Soft-deleted errata appear on the admin edit page.

**Implementation:**

Add `isNull(articles.deletedAt)` to the where clause:

```typescript
export async function getErrata(parentId: string) {
  await requireAuth();
  return db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.parentId, parentId),
        isNull(articles.deletedAt)
      )
    );
}
```

Note: The `and` import is already present at the top of the file.

**Commit:** `fix: filter out soft-deleted errata in getErrata()`
