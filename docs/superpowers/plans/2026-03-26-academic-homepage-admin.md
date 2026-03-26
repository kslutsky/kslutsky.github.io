# Academic Homepage Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js admin panel for managing academic publications with arXiv/DOI metadata auto-fetch, replacing the current static HTML homepage.

**Architecture:** Single Next.js App Router app on Vercel. Neon Postgres with Drizzle ORM stores articles, authors, and tags. Admin pages behind GitHub OAuth; public pages server-rendered with on-demand cache revalidation. External metadata fetched from arXiv (XML), CrossRef (JSON), and OpenAlex (JSON) APIs.

**Tech Stack:** Next.js 14+, Drizzle ORM, Neon Postgres, NextAuth.js, Tailwind CSS, Zod, Vercel Blob, KaTeX (rehype-katex + remark-math), Vitest

**Spec:** `docs/superpowers/specs/2026-03-26-academic-homepage-admin-design.md`

---

## File Map

### New files to create

```
src/
├── app/
│   ├── layout.tsx                          # Root layout: Inter font, Tailwind globals
│   ├── (public)/
│   │   ├── layout.tsx                      # Public layout: navbar + footer
│   │   └── page.tsx                        # Homepage: hero + article list
│   ├── admin/
│   │   ├── layout.tsx                      # Admin layout: sidebar + viewport warning + session check
│   │   ├── page.tsx                        # Admin dashboard (redirect to /admin/articles)
│   │   ├── preview/page.tsx                # Public page preview with drafts
│   │   ├── articles/
│   │   │   ├── page.tsx                    # Article list table + trash tab
│   │   │   ├── new/page.tsx                # New article form (+ erratum via ?parentId)
│   │   │   └── [id]/page.tsx               # Edit article form
│   │   └── authors/
│   │       ├── page.tsx                    # Author list
│   │       └── [id]/page.tsx               # Edit author
│   └── api/
│       └── auth/[...nextauth]/route.ts     # NextAuth route handler
├── lib/
│   ├── db/
│   │   ├── schema.ts                       # Drizzle table definitions
│   │   ├── index.ts                        # Neon + Drizzle client singleton
│   │   └── seed.ts                         # Seed script for existing articles
│   ├── auth.ts                             # NextAuth config
│   ├── actions/
│   │   ├── articles.ts                     # Article CRUD server actions
│   │   ├── authors.ts                      # Author CRUD server actions
│   │   ├── upload.ts                       # PDF upload via Vercel Blob
│   │   └── fetch-metadata.ts               # Metadata fetch server actions
│   ├── fetchers/
│   │   ├── arxiv.ts                        # arXiv Atom XML → structured data
│   │   ├── crossref.ts                     # CrossRef JSON → structured data
│   │   └── openalex.ts                     # OpenAlex JSON → structured data
│   ├── validators/
│   │   ├── article.ts                      # Zod schemas for article input
│   │   └── author.ts                       # Zod schemas for author input
│   ├── bibtex.ts                           # BibTeX string generation
│   ├── render-math.ts                      # Server-side KaTeX rendering via rehype pipeline
│   ├── types.ts                            # ActionResult type, shared types
│   └── constants.ts                        # App config (owner author ID, etc.)
├── components/
│   ├── public/
│   │   ├── navbar.tsx                      # Top navigation bar
│   │   ├── hero-section.tsx                # Bio/photo/interests section
│   │   ├── article-list.tsx                # Chronological article list
│   │   ├── article-card.tsx                # Single article display
│   │   ├── abstract-toggle.tsx             # Client component: expand/collapse
│   │   ├── erratum-badge.tsx               # Compact erratum display
│   │   ├── bibtex-button.tsx               # Client component: download .bib
│   │   └── footer.tsx                      # Footer with contact info
│   └── admin/
│       ├── sidebar.tsx                     # Admin sidebar navigation
│       ├── viewport-warning.tsx            # Client component: < 768px warning
│       ├── article-table.tsx               # Article list with actions
│       ├── article-form.tsx                # Client component: article create/edit form
│       ├── author-form.tsx                 # Client component: author create/edit form
│       ├── author-table.tsx                # Author list with actions
│       ├── author-matcher.tsx              # Client component: fuzzy match confirmation UI
│       ├── pdf-upload.tsx                  # Client component: Vercel Blob upload
│       └── confirm-dialog.tsx              # Reusable confirmation dialog
├── middleware.ts                           # Auth guard for /admin/*
├── __tests__/
│   ├── lib/
│   │   ├── fetchers/
│   │   │   ├── arxiv.test.ts
│   │   │   ├── crossref.test.ts
│   │   │   └── openalex.test.ts
│   │   ├── validators/
│   │   │   ├── article.test.ts
│   │   │   └── author.test.ts
│   │   └── bibtex.test.ts
│   └── fixtures/
│       ├── arxiv-response.xml              # Sample arXiv API response
│       ├── crossref-response.json          # Sample CrossRef API response
│       └── openalex-author-response.json   # Sample OpenAlex API response
├── drizzle.config.ts                       # Drizzle Kit config
├── vitest.config.ts                        # Vitest config
└── tailwind.config.ts                      # Tailwind config
```

### Files to delete (after migration)

```
index.html                    # Replaced by Next.js public pages
resources/css/*.css           # Replaced by Tailwind
```

### Files to keep

```
papers/*.pdf                  # Keep during transition, migrate to Vercel Blob later
lecture-notes/*.pdf           # Keep as static assets
resources/kslutsky.jpg        # Move to public/ in Next.js
CNAME                         # Keep until domain migration
```

---

## Task Dependency Graph

```
Task 1 (Scaffold + types.ts + env setup)
  ├── Task 2 (DB Schema) ──────────────────────────────┐
  ├── Task 3 (Auth) ───────────────────────────────────┤
  ├── Task 4 (Validators) ─────────────────────────────┤
  ├── Task 5 (arXiv Fetcher) ──────────────────────────┤
  ├── Task 6 (CrossRef Fetcher) ───────────────────────┤
  └── Task 7 (OpenAlex Fetcher) ───────────────────────┤
                                                        ├── Task 8 (Author Actions)
                                                        │     └── Task 9 (Article Actions)
                                                        │           └── Task 10 (Metadata Fetch Actions)
                                                        │                 ├── Task 11 (Admin Layout)
                                                        │                 │     ├── Task 12 (Author Admin Pages)
                                                        │                 │     ├── Task 13 (Article List Page)
                                                        │                 │     │     └── Task 14 (Article Form Page)
                                                        │                 │     │           └── Task 15 (PDF Upload)
                                                        │                 │     │                 └── Task 16 (Erratum Form)
                                                        │                 │     └── Task 17 (Public Layout)
                                                        │                 │           └── Task 18 (Public Article List)
                                                        │                 │                 ├── Task 19 (Abstract + KaTeX)
                                                        │                 │                 ├── Task 20 (BibTeX Export)
                                                        │                 │                 └── Task 21 (Erratum Badge)
                                                        │                 └── Task 22 (Caching)
                                                        │                       └── Task 23 (Preview Mode)
                                                        └── Task 24 (Seed Data)
```

**Parallelizable groups:**
- Tasks 2-7 (DB schema, auth, validators, and all three fetchers — all depend only on Task 1)
- Tasks 12 + 17 (author admin + public layout)
- Tasks 19, then 20 → 21 sequentially (Tasks 20 and 21 both modify `article-card.tsx` — must not run in parallel to avoid merge conflicts)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `vitest.config.ts`, `drizzle.config.ts`, `.env.local.example`, `src/app/layout.tsx`, `src/lib/types.ts`

- [ ] **Step 1: Create Next.js app**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Note: Run from a new directory (not the current static site root). The current `index.html` and assets will be migrated later.

- [ ] **Step 2: Install dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless next-auth@beta zod @vercel/blob
npm install -D drizzle-kit vitest @vitejs/plugin-react dotenv
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Create Drizzle config**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 5: Create env example**

Create `.env.local.example`:

```
DATABASE_URL=postgresql://...@...neon.tech/...?sslmode=require
AUTH_SECRET=<generate with: npx auth secret>
AUTH_GITHUB_ID=<GitHub OAuth App Client ID>
AUTH_GITHUB_SECRET=<GitHub OAuth App Client Secret>
ALLOWED_GITHUB_USERNAME=<your GitHub username>
CONTACT_EMAIL=<your email for API User-Agent>
BLOB_READ_WRITE_TOKEN=<Vercel Blob token>
```

- [ ] **Step 6: Add test script to package.json**

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 7: Create shared types**

Create `src/lib/types.ts`:

```typescript
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export const ARTICLE_TYPES = ["preprint", "published", "erratum"] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const PDF_SOURCES = ["arxiv", "upload", "external"] as const;
export type PdfSource = (typeof PDF_SOURCES)[number];

export const TAG_TYPES = ["keyword", "arxiv_subject", "msc_code"] as const;
export type TagType = (typeof TAG_TYPES)[number];
```

- [ ] **Step 8: Create `.env.local` from example and configure prerequisites**

```bash
cp .env.local.example .env.local
```

Before proceeding to Task 2, you must:
1. **Create a Neon project** at neon.tech — copy the connection string into `DATABASE_URL`
2. **Create a GitHub OAuth App** at github.com/settings/developers — set callback URL to `http://localhost:3000/api/auth/callback/github`, copy Client ID and Secret into `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`
3. **Generate AUTH_SECRET**: run `npx auth secret` and paste the value
4. **Set ALLOWED_GITHUB_USERNAME** to your GitHub username
5. **Create a Vercel project** (needed for Blob storage in Task 15) — copy the Blob token into `BLOB_READ_WRITE_TOKEN`. This can be deferred until Task 15 if desired.

- [ ] **Step 9: Verify scaffold works**

```bash
npm run dev
```

Expected: Next.js dev server starts on localhost:3000.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with Drizzle, Tailwind, Vitest"
```

---

## Task 2: Database Schema + Migration

**Files:**
- Create: `src/lib/db/schema.ts`, `src/lib/db/index.ts`

Note: `src/lib/types.ts` was already created in Task 1, Step 7.

- [ ] **Step 1: Create Drizzle schema**

Create `src/lib/db/schema.ts`:

```typescript
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    parentId: uuid("parent_id").references(() => articles.id),
    arxivId: text("arxiv_id").unique(),
    arxivVersion: integer("arxiv_version"),
    doi: text("doi").unique(),
    title: text("title").notNull(),
    abstract: text("abstract"),
    pdfUrl: text("pdf_url"),
    pdfSource: text("pdf_source"),
    journalName: text("journal_name"),
    volume: text("volume"),
    issue: text("issue"),
    pages: text("pages"),
    publishedYear: integer("published_year"),
    publishedMonth: integer("published_month"),
    publishedDay: integer("published_day"),
    authorIds: uuid("author_ids").array().notNull().default(sql`'{}'::uuid[]`),
    tagIds: uuid("tag_ids").array().notNull().default(sql`'{}'::uuid[]`),
    status: text("status").notNull().default("draft"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("articles_status_idx").on(table.status),
    index("articles_author_ids_gin_idx").using("gin", table.authorIds),
    index("articles_tag_ids_gin_idx").using("gin", table.tagIds),
    check(
      "type_check",
      sql`${table.type} IN ('preprint', 'published', 'erratum')`
    ),
    check(
      "status_check",
      sql`${table.status} IN ('draft', 'published')`
    ),
    check(
      "erratum_parent_check",
      sql`(${table.type} = 'erratum' AND ${table.parentId} IS NOT NULL) OR (${table.type} != 'erratum' AND ${table.parentId} IS NULL)`
    ),
    check(
      "pdf_source_check",
      sql`${table.pdfSource} IS NULL OR ${table.pdfSource} IN ('arxiv', 'upload', 'external')`
    ),
    check(
      "pdf_source_arxiv_check",
      sql`${table.pdfSource} != 'arxiv' OR ${table.arxivId} IS NOT NULL`
    ),
    check(
      "pdf_source_upload_check",
      sql`${table.pdfSource} != 'upload' OR ${table.pdfUrl} IS NOT NULL`
    ),
    check(
      "pdf_source_external_check",
      sql`${table.pdfSource} != 'external' OR ${table.pdfUrl} IS NOT NULL`
    ),
    check(
      "published_year_check",
      sql`${table.publishedYear} IS NULL OR (${table.publishedYear} >= 1900 AND ${table.publishedYear} <= 2100)`
    ),
    check(
      "published_month_check",
      sql`${table.publishedMonth} IS NULL OR (${table.publishedMonth} >= 1 AND ${table.publishedMonth} <= 12)`
    ),
    check(
      "published_day_check",
      sql`${table.publishedDay} IS NULL OR (${table.publishedDay} >= 1 AND ${table.publishedDay} <= 31)`
    ),
  ]
);

export const authors = pgTable("authors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  openAlexId: text("open_alex_id").unique(),
  orcid: text("orcid").unique(),
  affiliation: text("affiliation"),
  homepage: text("homepage"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),
  },
  (table) => [
    check(
      "tag_type_check",
      sql`${table.type} IN ('keyword', 'arxiv_subject', 'msc_code')`
    ),
  ]
);
```

- [ ] **Step 2: Create DB client**

Create `src/lib/db/index.ts`:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 3: Generate and run migration**

```bash
npm run db:generate
```

Expected: Migration files generated in `src/lib/db/migrations/`.

- [ ] **Step 4: Add updatedAt trigger via custom SQL migration**

**Important:** Drizzle Kit only runs migration files it generated — manually added `.sql` files are ignored. Run this trigger SQL directly via the Neon console (SQL Editor in the Neon dashboard) or via a separate script: `npx tsx -e "import { neon } from '@neondatabase/serverless'; const sql = neon(process.env.DATABASE_URL!); await sql\`...\`"`. The trigger SQL:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_set_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER authors_set_updated_at
  BEFORE UPDATE ON authors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

- [ ] **Step 5: Push schema to Neon**

```bash
npm run db:push
```

Expected: Tables created in Neon. Verify via `npm run db:studio`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add database schema with articles, authors, tags tables"
```

---

## Task 3: Authentication

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`

- [ ] **Step 1: Create NextAuth config**

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Note: requireAuth() helper is defined below for use in server actions
  providers: [GitHub],
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_GITHUB_USERNAME;
      if (!allowed) return false;
      return (
        profile?.login?.toLowerCase() === allowed.toLowerCase()
      );
    },
  },
});
```

Add a `requireAuth()` helper at the bottom of the same file, exported for use in server actions:

```typescript
export async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}
```

- [ ] **Step 2: Create route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create middleware**

Create `src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth";

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/admin")) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 4: Verify auth flow manually**

```bash
npm run dev
```

Navigate to `/admin` — should redirect to GitHub sign-in. After signing in with the allowed username, should access admin pages. Any other user should be rejected.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add GitHub OAuth auth with single-user restriction"
```

---

## Task 4: Zod Validators

**Files:**
- Create: `src/lib/validators/article.ts`, `src/lib/validators/author.ts`, `src/__tests__/lib/validators/article.test.ts`, `src/__tests__/lib/validators/author.test.ts`

- [ ] **Step 1: Write article validator tests**

Create `src/__tests__/lib/validators/article.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { articleCreateSchema, arxivIdSchema } from "@/lib/validators/article";

describe("arxivIdSchema", () => {
  it("accepts new-style arXiv ID", () => {
    expect(arxivIdSchema.parse("2301.12345")).toBe("2301.12345");
  });

  it("accepts old-style arXiv ID", () => {
    expect(arxivIdSchema.parse("math/0601234")).toBe("math/0601234");
  });

  it("accepts old-style with subcategory", () => {
    expect(arxivIdSchema.parse("math.DS/0601234")).toBe("math.DS/0601234");
  });

  it("rejects invalid format", () => {
    expect(() => arxivIdSchema.parse("not-an-id")).toThrow();
  });

  it("strips URL prefix", () => {
    expect(arxivIdSchema.parse("https://arxiv.org/abs/2301.12345")).toBe(
      "2301.12345"
    );
  });

  it("strips arxiv: prefix", () => {
    expect(arxivIdSchema.parse("arxiv:2301.12345")).toBe("2301.12345");
  });
});

describe("articleCreateSchema", () => {
  it("accepts valid published article", () => {
    const result = articleCreateSchema.parse({
      type: "published",
      title: "My Paper",
      status: "draft",
      publishedYear: 2024,
      publishedMonth: 3,
      publishedDay: 15,
    });
    expect(result.title).toBe("My Paper");
  });

  it("rejects impossible calendar date", () => {
    expect(() =>
      articleCreateSchema.parse({
        type: "published",
        title: "My Paper",
        status: "draft",
        publishedYear: 2024,
        publishedMonth: 2,
        publishedDay: 30,
      })
    ).toThrow();
  });

  it("allows year-only date", () => {
    const result = articleCreateSchema.parse({
      type: "published",
      title: "My Paper",
      status: "draft",
      publishedYear: 2024,
    });
    expect(result.publishedMonth).toBeUndefined();
  });

  it("rejects erratum without parentId", () => {
    expect(() =>
      articleCreateSchema.parse({
        type: "erratum",
        title: "Erratum",
        status: "draft",
      })
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/lib/validators/article.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement article validator**

Create `src/lib/validators/article.ts`:

```typescript
import { z } from "zod";
import { ARTICLE_TYPES, ARTICLE_STATUSES, PDF_SOURCES } from "@/lib/types";

export const arxivIdSchema = z
  .string()
  .transform((val) => {
    val = val.replace(/^https?:\/\/arxiv\.org\/abs\//, "");
    val = val.replace(/^arxiv:/, "");
    return val;
  })
  .pipe(
    z
      .string()
      .regex(
        /^(\d{4}\.\d{4,5}(v\d+)?|[a-zA-Z-]+(\.[A-Z]{2})?\/\d{7}(v\d+)?)$/,
        "Invalid arXiv ID format"
      )
  )
  .transform((val) => val.replace(/v\d+$/, "")); // Version stripped — extracted separately by fetcher, not from user input

export const doiSchema = z
  .string()
  .regex(/^10\.\d{4,9}\//, "Invalid DOI format");

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export const articleCreateSchema = z
  .object({
    type: z.enum(ARTICLE_TYPES),
    parentId: z.string().uuid().optional(),
    arxivId: arxivIdSchema.optional(),
    arxivVersion: z.number().int().positive().optional(),
    doi: doiSchema.optional(),
    title: z.string().min(1, "Title is required"),
    abstract: z.string().optional(),
    pdfUrl: z.string().url().optional(),
    pdfSource: z.enum(PDF_SOURCES).optional(),
    journalName: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    publishedYear: z.number().int().min(1900).max(2100).optional(),
    publishedMonth: z.number().int().min(1).max(12).optional(),
    publishedDay: z.number().int().min(1).max(31).optional(),
    authorIds: z.array(z.string().uuid()).default([]),
    tagIds: z.array(z.string().uuid()).default([]),
    status: z.enum(ARTICLE_STATUSES).default("draft"),
  })
  .refine(
    (data) => {
      if (data.type === "erratum" && !data.parentId) return false;
      if (data.type !== "erratum" && data.parentId) return false;
      return true;
    },
    { message: "Errata must have parentId; non-errata must not" }
  )
  .refine(
    (data) => {
      if (
        data.publishedYear != null &&
        data.publishedMonth != null &&
        data.publishedDay != null
      ) {
        return isValidDate(
          data.publishedYear,
          data.publishedMonth,
          data.publishedDay
        );
      }
      return true;
    },
    { message: "Invalid calendar date" }
  );

export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;
```

- [ ] **Step 4: Run article validator tests**

```bash
npx vitest run src/__tests__/lib/validators/article.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Write author validator tests**

Create `src/__tests__/lib/validators/author.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { authorCreateSchema } from "@/lib/validators/author";

describe("authorCreateSchema", () => {
  it("accepts valid author", () => {
    const result = authorCreateSchema.parse({ name: "John Doe" });
    expect(result.name).toBe("John Doe");
  });

  it("rejects empty name", () => {
    expect(() => authorCreateSchema.parse({ name: "" })).toThrow();
  });

  it("accepts valid ORCID", () => {
    const result = authorCreateSchema.parse({
      name: "Jane",
      orcid: "0000-0002-1234-5678",
    });
    expect(result.orcid).toBe("0000-0002-1234-5678");
  });

  it("rejects invalid ORCID format", () => {
    expect(() =>
      authorCreateSchema.parse({ name: "Jane", orcid: "not-orcid" })
    ).toThrow();
  });
});
```

- [ ] **Step 6: Implement author validator**

Create `src/lib/validators/author.ts`:

```typescript
import { z } from "zod";

export const orcidSchema = z
  .string()
  .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, "Invalid ORCID format");

export const authorCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  openAlexId: z.string().optional(),
  orcid: orcidSchema.optional(),
  affiliation: z.string().optional(),
  homepage: z.string().url().optional().or(z.literal("")),
});

export type AuthorCreateInput = z.infer<typeof authorCreateSchema>;
```

- [ ] **Step 7: Run all validator tests**

```bash
npx vitest run src/__tests__/lib/validators/
```

Expected: All PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Zod validators for articles and authors"
```

---

## Task 5: arXiv Fetcher

**Files:**
- Create: `src/lib/fetchers/arxiv.ts`, `src/__tests__/lib/fetchers/arxiv.test.ts`, `src/__tests__/fixtures/arxiv-response.xml`

- [ ] **Step 1: Create arXiv fixture**

Create `src/__tests__/fixtures/arxiv-response.xml` with a sample arXiv Atom feed containing one entry with: id (with version), title, summary, two authors, published date, primary_category (math.DS), secondary category (math.GR), and PDF link.

- [ ] **Step 2: Write arXiv fetcher tests**

Create `src/__tests__/lib/fetchers/arxiv.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseArxivResponse, normalizeArxivId } from "@/lib/fetchers/arxiv";
import { readFileSync } from "fs";
import { join } from "path";

const fixture = readFileSync(
  join(__dirname, "../fixtures/arxiv-response.xml"),
  "utf-8"
);

describe("normalizeArxivId", () => {
  it("strips URL prefix", () => {
    expect(normalizeArxivId("https://arxiv.org/abs/2301.12345")).toBe(
      "2301.12345"
    );
  });

  it("strips version suffix", () => {
    expect(normalizeArxivId("2301.12345v3")).toBe("2301.12345");
  });

  it("keeps old-style ID intact", () => {
    expect(normalizeArxivId("math.DS/0601234")).toBe("math.DS/0601234");
  });
});

describe("parseArxivResponse", () => {
  it("extracts title", () => {
    const result = parseArxivResponse(fixture);
    expect(result.title).toBe("A Very Important Theorem About Groups");
  });

  it("extracts abstract", () => {
    const result = parseArxivResponse(fixture);
    expect(result.abstract).toContain("countable group");
  });

  it("extracts authors in order", () => {
    const result = parseArxivResponse(fixture);
    expect(result.authors).toEqual(["Konstantin Slutsky", "Jane Doe"]);
  });

  it("extracts arXiv ID without version", () => {
    const result = parseArxivResponse(fixture);
    expect(result.arxivId).toBe("2301.12345");
  });

  it("extracts version number", () => {
    const result = parseArxivResponse(fixture);
    expect(result.arxivVersion).toBe(2);
  });

  it("extracts PDF URL", () => {
    const result = parseArxivResponse(fixture);
    expect(result.pdfUrl).toBe("http://arxiv.org/pdf/2301.12345v2");
  });

  it("extracts primary category", () => {
    const result = parseArxivResponse(fixture);
    expect(result.primaryCategory).toBe("math.DS");
  });

  it("extracts all categories", () => {
    const result = parseArxivResponse(fixture);
    expect(result.categories).toEqual(["math.DS", "math.GR"]);
  });

  it("extracts published date", () => {
    const result = parseArxivResponse(fixture);
    expect(result.publishedYear).toBe(2023);
    expect(result.publishedMonth).toBe(1);
    expect(result.publishedDay).toBe(30);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/lib/fetchers/arxiv.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement arXiv fetcher**

Create `src/lib/fetchers/arxiv.ts`:

```typescript
export interface ArxivResult {
  arxivId: string;
  arxivVersion: number;
  title: string;
  abstract: string;
  authors: string[];
  pdfUrl: string;
  primaryCategory: string;
  categories: string[];
  publishedYear: number;
  publishedMonth: number;
  publishedDay: number;
}

export function normalizeArxivId(input: string): string {
  let id = input.trim();
  id = id.replace(/^https?:\/\/arxiv\.org\/abs\//, "");
  id = id.replace(/^arxiv:/, "");
  id = id.replace(/v\d+$/, "");
  return id;
}

function extractVersion(idUrl: string): number {
  const match = idUrl.match(/v(\d+)$/);
  return match ? parseInt(match[1], 10) : 1;
}

export function parseArxivResponse(xml: string): ArxivResult {
  // Parse XML using regex — sufficient for arXiv's well-structured Atom feed
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) throw new Error("No entry found in arXiv response");

  const idUrl = entry.match(/<id>(.*?)<\/id>/)?.[1] ?? "";
  const rawId = idUrl.replace("http://arxiv.org/abs/", "");
  const arxivId = normalizeArxivId(rawId);
  const arxivVersion = extractVersion(rawId);

  const title = (entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "")
    .replace(/\s+/g, " ")
    .trim();

  const abstract = (entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? "")
    .replace(/\s+/g, " ")
    .trim();

  const authorMatches = [...entry.matchAll(/<author>\s*<name>(.*?)<\/name>\s*<\/author>/g)];
  const authors = authorMatches.map((m) => m[1].trim());

  const pdfLink = entry.match(
    /<link[^>]*type="application\/pdf"[^>]*href="([^"]*)"[^>]*\/>/
  );
  const pdfUrl = pdfLink?.[1] ?? "";

  const primaryCat = entry.match(
    /<arxiv:primary_category[^>]*term="([^"]*)"[^>]*\/>/
  );
  const primaryCategory = primaryCat?.[1] ?? "";

  const catMatches = [
    ...entry.matchAll(/<category[^>]*term="([^"]*)"[^>]*\/>/g),
  ];
  const categories = catMatches.map((m) => m[1]);

  const publishedStr = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? "";
  // Parse date components directly from ISO string to avoid timezone issues
  // (new Date() with ISO strings uses UTC, but getDate() uses local time)
  const [datePart] = publishedStr.split("T");
  const [pubYear, pubMonth, pubDay] = datePart.split("-").map(Number);

  return {
    arxivId,
    arxivVersion,
    title,
    abstract,
    authors,
    pdfUrl,
    primaryCategory,
    categories,
    publishedYear: pubYear,
    publishedMonth: pubMonth,
    publishedDay: pubDay,
  };
}

const USER_AGENT = `AcademicHomepage/1.0 (mailto:${process.env.CONTACT_EMAIL ?? "unknown"})`;

// arXiv requires 3-second delay between requests
let lastArxivCall = 0;
async function arxivRateLimit() {
  const elapsed = Date.now() - lastArxivCall;
  if (elapsed < 3000) {
    await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
  }
  lastArxivCall = Date.now();
}

export async function fetchArxivMetadata(
  arxivId: string
): Promise<ArxivResult> {
  await arxivRateLimit();
  const normalizedId = normalizeArxivId(arxivId);
  const url = `http://export.arxiv.org/api/query?id_list=${normalizedId}`;

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`arXiv API returned ${response.status}`);
  }

  const xml = await response.text();
  return parseArxivResponse(xml);
}
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/__tests__/lib/fetchers/arxiv.test.ts
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add arXiv metadata fetcher with XML parsing"
```

---

## Task 6: CrossRef Fetcher

**Files:**
- Create: `src/lib/fetchers/crossref.ts`, `src/__tests__/lib/fetchers/crossref.test.ts`, `src/__tests__/fixtures/crossref-response.json`

- [ ] **Step 1: Create CrossRef fixture**

Create `src/__tests__/fixtures/crossref-response.json` with a sample CrossRef works response containing: DOI, title array, abstract with JATS tags, two authors (one with ORCID), container-title, volume, issue, page, and published-print date-parts.

- [ ] **Step 2: Write CrossRef fetcher tests**

Create `src/__tests__/lib/fetchers/crossref.test.ts` testing: title extraction, JATS tag stripping from abstract, author extraction with ORCID parsing, journal info, publication date, and DOI.

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/lib/fetchers/crossref.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Implement CrossRef fetcher**

Create `src/lib/fetchers/crossref.ts` with `parseCrossRefResponse` (pure function parsing the `message` object) and `fetchCrossRefMetadata` (async function calling the CrossRef API with polite User-Agent). Strip JATS tags from abstract. Extract ORCID from URL format. Handle both `published-print` and `published-online` date fields.

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/__tests__/lib/fetchers/crossref.test.ts
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add CrossRef metadata fetcher"
```

---

## Task 7: OpenAlex Fetcher

**Files:**
- Create: `src/lib/fetchers/openalex.ts`, `src/__tests__/lib/fetchers/openalex.test.ts`, `src/__tests__/fixtures/openalex-author-response.json`

- [ ] **Step 1: Create OpenAlex fixture**

Create `src/__tests__/fixtures/openalex-author-response.json` with a sample OpenAlex author response containing: id, display_name, orcid URL, last_known_institutions array, works_count, cited_by_count.

- [ ] **Step 2: Write OpenAlex fetcher tests**

Create `src/__tests__/lib/fetchers/openalex.test.ts` testing: display name extraction, OpenAlex ID parsing (strip URL prefix), ORCID parsing (strip URL prefix), affiliation extraction from last_known_institutions.

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/lib/fetchers/openalex.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Implement OpenAlex fetcher**

Create `src/lib/fetchers/openalex.ts` with `parseOpenAlexAuthor` (pure function) and `fetchOpenAlexAuthor` (async, supports lookup by OpenAlex ID, ORCID, or name search). Use polite User-Agent header.

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/__tests__/lib/fetchers/openalex.test.ts
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add OpenAlex author metadata fetcher"
```

---

## Task 8: Author CRUD Server Actions

**Files:**
- Create: `src/lib/actions/authors.ts`

- [ ] **Step 1: Implement author server actions**

Create `src/lib/actions/authors.ts` with: `createAuthor`, `updateAuthor`, `deleteAuthor` (with referential integrity check against authorIds arrays), `getAuthors`, `getAuthor`. All mutations require auth via `requireAuth()` helper. Validation via `authorCreateSchema`. `updateAuthor` calls `revalidateTag('articles')` since name changes affect public display.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add author CRUD server actions"
```

---

## Task 9: Article CRUD Server Actions

**Files:**
- Create: `src/lib/actions/articles.ts`

- [ ] **Step 1: Implement article server actions**

Create `src/lib/actions/articles.ts` with:
- `createArticle` — validates with Zod, checks authorIds/tagIds referential integrity, verifies parent is not an erratum for errata, calls `revalidateTag` on publish
- `updateArticle` — same validation, always revalidates
- `softDeleteArticle` — cascades soft-delete to errata. **Must use a single transaction** with a captured `const now = new Date()` to ensure parent and cascade-deleted errata share the exact same `deletedAt` timestamp (used to distinguish cascade-deletes from independent deletes on restore)
- `restoreArticle` — blocks restoring erratum while parent is trashed; cascade-restores errata that share the same `deletedAt` timestamp
- `toggleArticleStatus` — with `revalidateTag`
- `getArticles(includeDeleted)` — ordered by publishedYear DESC, publishedMonth DESC NULLS LAST, publishedDay DESC NULLS LAST, createdAt DESC
- `getPublishedArticles` — same order, filtered to status=published + deletedAt IS NULL + type != erratum
- `getPublishedErrata` — all errata with status=published + deletedAt IS NULL (for public page display)
- `getArticle(id)`, `getErrata(parentId)` (admin — returns all statuses)

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add article CRUD server actions with soft-delete cascade"
```

---

## Task 10: Metadata Fetch Server Actions

**Files:**
- Create: `src/lib/actions/fetch-metadata.ts`

- [ ] **Step 1: Implement metadata fetch actions**

Create `src/lib/actions/fetch-metadata.ts` with:
- `fetchArxiv`, `fetchDoi`, `fetchAuthorMetadata` — thin wrappers around the fetcher functions that add auth checks and return `ActionResult<T>`.
- `matchAuthors(fetchedNames: string[], fetchedOrcids: (string | undefined)[])` — server action that performs the DB-side author matching logic. For each fetched author: (a) if ORCID is provided, query authors by ORCID (exact match); (b) if no ORCID match, query by case-insensitive normalized Unicode name comparison; (c) if no exact match, query all authors and compute Levenshtein edit distance, returning candidates with distance <= 2. Returns `{ matched: { fetchedName, existingAuthor }[], unmatched: { fetchedName, candidates: Author[] }[] }`. The `AuthorMatcher` client component (Task 14) calls this action and displays the results for user confirmation.

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add metadata fetch server actions for arXiv, CrossRef, OpenAlex"
```

---

## Task 11: Admin Layout + Sidebar + Viewport Warning

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/components/admin/sidebar.tsx`, `src/components/admin/viewport-warning.tsx`

- [ ] **Step 1: Create viewport warning component**

Create `src/components/admin/viewport-warning.tsx` — a client component that checks `window.innerWidth < 768` and shows a full-screen overlay message if true. Listens to resize events.

- [ ] **Step 2: Create sidebar component**

Create `src/components/admin/sidebar.tsx` — a client component with nav links to Articles, Authors, Preview. Highlights active route using `usePathname()`.

- [ ] **Step 3: Create admin layout**

Create `src/app/admin/layout.tsx` — server component with session check (`auth()`, redirect if not authenticated). Renders `ViewportWarning`, `Sidebar`, and main content area in a flex layout.

- [ ] **Step 4: Create admin dashboard (redirect)**

Create `src/app/admin/page.tsx` — redirects to `/admin/articles`.

- [ ] **Step 5: Verify manually**

```bash
npm run dev
```

Navigate to `/admin` — should see sidebar and redirect to `/admin/articles`. Below 768px should see viewport warning overlay.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add admin layout with sidebar and viewport warning"
```

---

## Task 12: Author Admin Pages

**Files:**
- Create: `src/app/admin/authors/page.tsx`, `src/app/admin/authors/[id]/page.tsx`, `src/components/admin/author-table.tsx`, `src/components/admin/author-form.tsx`, `src/components/admin/confirm-dialog.tsx`

- [ ] **Step 1: Create confirm dialog component**

Create `src/components/admin/confirm-dialog.tsx` — a reusable modal with title, message, confirm/cancel buttons. Used for delete confirmations and publish toggle.

- [ ] **Step 2: Create author table component**

Create `src/components/admin/author-table.tsx` — displays authors in a table with columns: name (link to edit), affiliation, article count, delete action (with confirm dialog). Calls `deleteAuthor` action. Shows error message if delete is blocked.

- [ ] **Step 3: Create author form component**

Create `src/components/admin/author-form.tsx` — client component with: OpenAlex/ORCID/name fetch input + Fetch button, editable fields (name, ORCID, OpenAlex ID, affiliation, homepage). Calls `createAuthor` or `updateAuthor` on submit. Navigates back to `/admin/authors` on success.

- [ ] **Step 4: Create author list page**

Create `src/app/admin/authors/page.tsx` — server component that fetches all authors and article counts (by scanning authorIds arrays), renders AuthorTable + "New Author" link.

- [ ] **Step 5: Create author edit/new page**

Create `src/app/admin/authors/[id]/page.tsx` — server component that handles both `new` (id="new") and edit (existing UUID) cases. Renders AuthorForm with or without existing data.

- [ ] **Step 6: Verify manually**

```bash
npm run dev
```

Navigate to `/admin/authors` — create, edit, and delete authors. Test OpenAlex fetch.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add author admin pages with CRUD and OpenAlex fetch"
```

---

## Task 13: Article List Page

**Files:**
- Create: `src/app/admin/articles/page.tsx`, `src/components/admin/article-table.tsx`

- [ ] **Step 1: Create article table component**

Create `src/components/admin/article-table.tsx` — client component displaying articles in a table with: title, type badge, status badge, year, actions (edit link, add erratum link, publish/unpublish toggle with confirm dialog, soft delete with confirm). Tab state for active/trash. Below 1024px collapses to card-list with kebab menu. Trash tab shows restore button. See spec lines 241-248.

- [ ] **Step 2: Create article list page**

Create `src/app/admin/articles/page.tsx` — server component fetching active and trashed articles plus all authors (for name display). Renders ArticleTable with tab controlled by `?tab=trash` search param. Includes "New Article" link.

- [ ] **Step 3: Verify manually**

```bash
npm run dev
```

Navigate to `/admin/articles` — should see empty table, tabs, "New Article" link.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add article list page with trash tab and action buttons"
```

---

## Task 14: Article Form Page

**Files:**
- Create: `src/app/admin/articles/new/page.tsx`, `src/app/admin/articles/[id]/page.tsx`, `src/components/admin/article-form.tsx`, `src/components/admin/author-matcher.tsx`

- [ ] **Step 1: Create author matcher component**

Create `src/components/admin/author-matcher.tsx` — client component for the author confirmation step after metadata fetch. Receives fetched author names and existing DB authors. For each fetched author: matches by ORCID first (if available), then case-insensitive Unicode name comparison, then presents edit distance <= 2 candidates. Shows UI: "Matched to [existing author]" or "New — confirm or reassign". Returns confirmed authorIds array.

- [ ] **Step 2: Create article form component**

Create `src/components/admin/article-form.tsx` — client component with:
- arXiv ID input + Fetch button (becomes "Re-fetch (will overwrite edits)" after first fetch)
- DOI input + Fetch button (same re-fetch behavior)
- All fields editable: title (textarea), abstract (textarea), type (radio), published date (year/month/day inputs), journal name, volume, issue, pages
- PDF source radio buttons (arXiv auto / upload / external URL)
- Author selection: AuthorMatcher on fetch, or manual add via search dropdown
- Status: "Save as Draft" and "Publish" buttons
- Calls `createArticle` or `updateArticle` action on submit

- [ ] **Step 3: Create new article page**

Create `src/app/admin/articles/new/page.tsx` — server component that loads all authors and optional parent article (from `?parentId` query param). Renders ArticleForm with parent info if present (erratum mode).

- [ ] **Step 4: Create edit article page**

Create `src/app/admin/articles/[id]/page.tsx` — server component that loads article, authors, and errata. Renders ArticleForm with existing data. Below the form: errata section with list of existing errata and "+ Add Erratum" link.

- [ ] **Step 5: Verify manually — create article via arXiv fetch**

```bash
npm run dev
```

Navigate to `/admin/articles/new`, enter a real arXiv ID, click Fetch, verify fields populate, confirm authors, save as draft.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add article form with arXiv/DOI fetch and author matching"
```

---

## Task 15: PDF Upload

**Files:**
- Create: `src/components/admin/pdf-upload.tsx`, `src/lib/actions/upload.ts`

- [ ] **Step 1: Create upload server action**

Create `src/lib/actions/upload.ts` with `uploadPdf` (accepts FormData, validates file type is PDF, uploads to Vercel Blob, returns URL) and `deletePdf`. Both require auth.

- [ ] **Step 2: Create PDF upload component**

Create `src/components/admin/pdf-upload.tsx` — client component with hidden file input, "Choose PDF" / "Replace PDF" button, upload progress state, link to view current PDF, error display.

- [ ] **Step 3: Integrate into article form**

Modify `src/components/admin/article-form.tsx` to include PdfUpload component when pdfSource is "upload". Show radio buttons for PDF source selection.

- [ ] **Step 4: Verify manually — upload a PDF**

Test in dev: create an article, select "Upload" PDF source, upload a PDF, verify URL is stored and link works.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add PDF upload via Vercel Blob"
```

---

## Task 16: Erratum Form Behavior

**Files:**
- Modify: `src/components/admin/article-form.tsx`

- [ ] **Step 1: Add erratum mode to article form**

When the `parent` prop is provided (from `?parentId` query param), the article form should:
- Set `type = "erratum"` and `parentId` automatically (hidden)
- Hide the arXiv ID field
- Pre-fill title with `"Erratum to \"${parent.title}\""`
- Pre-populate authorIds from parent (editable)
- Make PDF upload the most prominent element (move above other fields)
- Collapse DOI + journal fields under a disclosure ("Optional — for published errata")

- [ ] **Step 2: Verify manually**

Navigate to an existing article's edit page, click "+ Add Erratum", verify the streamlined form appears with correct defaults.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add streamlined erratum form mode"
```

---

## Task 17: Public Layout

**Files:**
- Create: `src/app/(public)/layout.tsx`, `src/components/public/navbar.tsx`, `src/components/public/hero-section.tsx`, `src/components/public/footer.tsx`
- Move: `resources/kslutsky.jpg` to `public/kslutsky.jpg`

- [ ] **Step 1: Move profile photo**

```bash
cp resources/kslutsky.jpg public/kslutsky.jpg
cp -r papers/ public/papers/
cp -r lecture-notes/ public/lecture-notes/
```

This ensures existing PDF URLs (e.g., `/papers/Smooth-orbit-equivalence.pdf`) resolve correctly in the Next.js app. These files will be migrated to Vercel Blob in a future iteration.

- [ ] **Step 2: Create navbar**

Create `src/components/public/navbar.tsx` — responsive navbar with name on left, section links on right (Publications, Lecture Notes). Sticky positioning. Hamburger menu on mobile. Clean design with Inter font.

- [ ] **Step 3: Create hero section**

Create `src/components/public/hero-section.tsx` — profile photo, name, "Assistant Professor at Iowa State University", research interests paragraph, research area tags. Responsive: side-by-side on desktop, stacked on mobile. All content hardcoded.

- [ ] **Step 4: Create footer**

Create `src/components/public/footer.tsx` — contact info, links. Hardcoded content.

- [ ] **Step 5: Create public layout**

Create `src/app/(public)/layout.tsx` wrapping children with Navbar and Footer. Content area max-width 3xl, centered, with responsive padding.

- [ ] **Step 6: Verify manually**

```bash
npm run dev
```

Navigate to `/` — should see navbar, hero section, footer. Test at 375px, 768px, 1024px, 1440px.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add public layout with navbar, hero section, footer"
```

---

## Task 18: Public Article List

**Files:**
- Create: `src/app/(public)/page.tsx`, `src/components/public/article-list.tsx`, `src/components/public/article-card.tsx`

- [ ] **Step 1: Create article card component**

Create `src/components/public/article-card.tsx` — displays single article: title (with KaTeX math via a `MathTitle` client component that uses `katex.render()` for `$...$` segments, same approach as abstract-toggle), all authors in order, publication info ("Journal, Vol X (Year), pages" for published; "Preprint, arXiv:XXXX vN" for preprints), links row ([arXiv] [DOI] [PDF] [BibTeX]) with 44px min tap targets. Accepts optional `showDraftBadge` prop for preview mode.

- [ ] **Step 2: Create article list component**

Create `src/components/public/article-list.tsx` — renders flat list of article cards. Receives articles, author map, errata map, and optional `showDraftBadge` flag.

- [ ] **Step 3: Create public homepage**

Create `src/app/(public)/page.tsx` — server component that wraps **all** DB queries in a single `unstable_cache` call with `tags: ['articles']`: published articles, **published** errata (filtering `status='published'` + `deletedAt IS NULL`), and all authors. Builds lookup maps. Pre-renders titles and abstracts through the `renderMath()` pipeline (from `src/lib/render-math.ts`). Renders HeroSection, ArticleList, and a hardcoded Lecture Notes section with links to `/lecture-notes/*.pdf` static files.

**Note on Vercel caching:** `unstable_cache` on Vercel serverless uses Vercel's Data Cache (not in-process memory). `revalidateTag('articles')` correctly invalidates across all function instances. Verify this works in Task 22 by checking that mutations immediately reflect on the public page.

- [ ] **Step 4: Verify manually**

Add a test article via admin, publish it. Navigate to `/` — should appear in the list.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add public article list with chronological display"
```

---

## Task 19: Abstract Toggle + KaTeX

**Files:**
- Create: `src/components/public/abstract-toggle.tsx`
- Install: `katex`, `rehype-katex`, `remark-math`

- [ ] **Step 1: Install KaTeX dependencies**

```bash
npm install katex rehype-katex remark-math
```

- [ ] **Step 2: Create abstract toggle component**

Create `src/components/public/abstract-toggle.tsx` — client component with expand/collapse button (`<button>` with `aria-expanded`). When expanded, renders pre-processed HTML (see below).

**KaTeX rendering strategy (SSR with MathML fallback):** Create a shared utility `src/lib/render-math.ts` that uses the `unified` + `remark-parse` + `remark-math` + `remark-rehype` + `rehype-katex` + `rehype-stringify` pipeline to convert markdown-like text (with `$...$` delimiters) into HTML with MathML fallback. This runs server-side. The public page pre-renders abstracts and titles through this pipeline and passes the resulting sanitized HTML string to client components. Import `katex/dist/katex.min.css` in the root layout.

Install additional dependency:
```bash
npm install unified remark-parse remark-math remark-rehype rehype-katex rehype-stringify rehype-sanitize
```

The `abstract-toggle.tsx` component receives `renderedHtml: string` (pre-rendered and sanitized server-side by our own pipeline via `rehype-sanitize`) and renders it. Since the HTML is generated server-side from our own controlled pipeline and sanitized, it is safe to render.

Similarly, article titles use the same pipeline. Create `src/lib/render-math.ts` as a server-only utility. Titles are rendered in `article-card.tsx` (server component) by calling `renderMath(title)` and outputting the sanitized result.

- [ ] **Step 3: Integrate into article card**

Modify `src/components/public/article-card.tsx` to render `<AbstractToggle>` when abstract is non-null.

- [ ] **Step 4: Verify manually**

Add an article with LaTeX in the abstract. Verify math renders correctly when expanded.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add expandable abstracts with KaTeX math rendering"
```

---

## Task 20: BibTeX Export

**Files:**
- Create: `src/lib/bibtex.ts`, `src/__tests__/lib/bibtex.test.ts`, `src/components/public/bibtex-button.tsx`

- [ ] **Step 1: Write BibTeX generation tests**

Create `src/__tests__/lib/bibtex.test.ts` testing:
- `@article` for published with correct fields
- `@unpublished` for preprint with eprint/archivePrefix
- `@misc` for erratum
- Null fields omitted
- Citation key uses `LastName` + `Year`
- Falls back to `createdAtYear` when `publishedYear` is null
- Author names formatted as "Last, First"
- `buildDisambiguationMap` returns `"a"`, `"b"` suffixes for colliding keys (two articles by same first author in same year)

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/lib/bibtex.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement BibTeX generator**

Create `src/lib/bibtex.ts` with two functions:
- `generateBibtex(input, disambiguationSuffix?)` — generates a single BibTeX entry. Entry types: `@article` (published), `@unpublished` (preprint), `@misc` (erratum). Citation key: first author last name + year + optional suffix (fallback to createdAtYear). Author format: "Last, First and Last, First". Include fields only when non-null: title, author, year, journal, volume, number, pages, doi, eprint, archivePrefix, abstract. Note: `primaryClass` (arXiv subject) is deferred — the schema stores arXiv subjects as tags but has no way to identify the primary one per article. This can be added in v2 when tag filtering is implemented.
- `buildDisambiguationMap(articles)` — takes the full article list, groups by (first author last name + year), and returns a `Map<articleId, suffix>` where suffix is `""`, `"a"`, `"b"`, etc. for keys that would collide. The public page calls this once and passes suffixes to each `generateBibtex` call.

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/__tests__/lib/bibtex.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Create BibTeX button component**

Create `src/components/public/bibtex-button.tsx` — client component that generates a Blob from the BibTeX string and triggers a download as `citation.bib`. Styled as a link button with 44px minimum tap target.

- [ ] **Step 6: Integrate into article card**

Modify `src/components/public/article-card.tsx` to render `<BibtexButton>` in the links row.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add BibTeX export with downloadable .bib files"
```

---

## Task 21: Erratum Badge on Public Page

**Files:**
- Create: `src/components/public/erratum-badge.tsx`

- [ ] **Step 1: Create erratum badge component**

Create `src/components/public/erratum-badge.tsx` — compact display: "Erratum (date)" with PDF and DOI links when available. Amber-tinted styling. Not a nested card. Links have 44px min tap targets. No expand toggle when abstract is null; show an expand/collapse toggle (reusing `AbstractToggle` component) when abstract is non-null.

- [ ] **Step 2: Integrate into article card**

Modify `src/components/public/article-card.tsx` to render `<ErratumBadge>` beneath the article for each erratum in the errataByParent map.

- [ ] **Step 3: Verify manually**

Add an erratum to a published article, verify it displays as a compact badge on the public page.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add erratum badge display on public article cards"
```

---

## Task 22: Caching Setup

**Files:**
- Verify: `src/app/(public)/page.tsx` uses `unstable_cache` with `tags: ['articles']`
- Verify: all mutating server actions call `revalidateTag('articles')`

- [ ] **Step 1: Audit revalidateTag calls**

Verify these server actions call `revalidateTag('articles')`:
- `createArticle` (when status is published)
- `updateArticle`
- `softDeleteArticle`
- `restoreArticle`
- `toggleArticleStatus`
- `updateAuthor` (name changes affect display)

- [ ] **Step 2: Verify cache behavior manually**

1. Publish an article via admin
2. Check public page — should appear immediately
3. Unpublish the article
4. Public page should update — article disappears

- [ ] **Step 3: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: ensure all mutations trigger cache revalidation"
```

---

## Task 23: Admin Preview Mode

**Files:**
- Create: `src/app/admin/preview/page.tsx`

- [ ] **Step 1: Create preview page**

Create `src/app/admin/preview/page.tsx` — server component that fetches ALL non-deleted articles (including drafts, excluding errata as top-level), all errata, and all authors. Renders the same HeroSection and ArticleList components as the public page, but passes `showDraftBadge={true}`. Shows a yellow banner: "Preview mode — draft articles are shown with a visual indicator."

- [ ] **Step 2: Add draft badge support to ArticleList/ArticleCard**

Modify components to accept `showDraftBadge` prop. When true and `article.status === 'draft'`, show a "DRAFT" badge on the card with dashed border or muted styling.

- [ ] **Step 3: Verify manually**

Create a draft article. Navigate to `/admin/preview` — should see it with a draft badge. Public page `/` should not show it.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add admin preview mode showing drafts"
```

---

## Task 24: Seed Existing Articles

**Files:**
- Create: `src/lib/db/seed.ts`

- [ ] **Step 1: Create seed data file**

Manually extract the 14 existing articles from `index.html` into a JSON file at `src/lib/db/seed-data.json`. For each article: title, abstract, authors (names), category section, journal info (if published), PDF filename, arXiv ID (if applicable), DOI (if applicable).

- [ ] **Step 2: Create seed script**

Create `src/lib/db/seed.ts` — a script that:
1. Reads seed-data.json
2. Creates author records for all unique coauthors (deduplicating by name)
3. Creates tag records for arXiv categories
4. Creates article records with proper authorIds, tagIds, type, status=published, and dates
5. Maps PDF filenames to relative URLs (e.g., `/papers/Smooth-orbit-equivalence.pdf`)

- [ ] **Step 3: Run seed script**

The seed script must import `'dotenv/config'` at the top to load `.env.local`:

```bash
npx tsx --env-file=.env.local src/lib/db/seed.ts
```

Verify all 14 articles and their authors appear in the admin panel and on the public page.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add seed script and migrate existing articles"
```

---

## Post-Implementation Checklist

After all tasks are complete:

**Testing:**
- [ ] Run full test suite: `npm run test`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Test responsive design at 375px, 768px, 1024px, 1440px viewpoints
- [ ] Test accessibility: keyboard navigation, screen reader, focus rings, color contrast
- [ ] Verify all 14 existing articles display correctly on public page
- [ ] Verify arXiv fetch with a real arXiv ID
- [ ] Verify DOI fetch with a real DOI
- [ ] Verify erratum creation and display
- [ ] Verify PDF upload works on Vercel (requires deployment)

**Production deployment:**
- [ ] Set all 7 environment variables in Vercel dashboard (DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, ALLOWED_GITHUB_USERNAME, CONTACT_EMAIL, BLOB_READ_WRITE_TOKEN)
- [ ] Update GitHub OAuth App callback URL to production domain
- [ ] Add `not-found.tsx` and `error.tsx` error boundary pages
- [ ] Add security headers in `next.config.ts` (CSP, X-Frame-Options)
- [ ] Deploy to Vercel and verify in production
- [ ] Domain migration (deferred — kslutsky.com stays on current site until ready)
