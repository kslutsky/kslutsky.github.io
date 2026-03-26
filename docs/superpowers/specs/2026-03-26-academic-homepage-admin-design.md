# Academic Homepage Admin Panel — Design Spec

## Overview

Replace the current static HTML academic homepage with a Next.js application featuring an admin panel for managing publications. The admin panel allows adding articles by arXiv ID or DOI with automatic metadata fetching, managing authors via OpenAlex, and publishing changes to a public-facing homepage.

## Goals

- Streamline adding publications: enter an arXiv ID or DOI, auto-fetch all metadata, review, publish
- Manage author profiles with automatic data from OpenAlex/ORCID
- Serve a responsive, accessible public homepage with a chronological list of publications
- Admin accessible from any browser (desktop/tablet) with GitHub OAuth
- Only static-equivalent output publicly visible (server-rendered, cached)
- Extensible to future sections (teaching history, etc.)

## Non-goals (v1)

- Filtering/sorting on the public page (deferred to v2)
- Topic/section grouping of articles
- Mobile-responsive admin forms (admin is desktop/tablet only, 768px+)
- CMS-managed bio/contact section (hardcoded for now)
- Bulk operations in admin

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router |
| Hosting | Vercel |
| Database | Neon Postgres |
| ORM | Drizzle |
| Auth | NextAuth.js (GitHub OAuth, single username) |
| Styling | Tailwind CSS |
| File storage | Vercel Blob (PDF uploads) |
| Validation | Zod |
| Math rendering | KaTeX (latest, via rehype-katex + remark-math) |

**Repository**: Single private GitHub repo (GitHub Education for free private Pages-equivalent hosting on Vercel). Custom domain (kslutsky.com) stays on current site until migration is complete.

---

## Database Schema

### Articles

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | PK, default random |
| `type` | text | CHECK: `preprint`, `published`, or `erratum` |
| `parentId` | UUID (nullable) | Self-ref FK to Articles.id |
| `arxivId` | text (nullable) | Unique. Normalized to bare format (e.g., `2301.12345` or `math/0601234`) |
| `arxivVersion` | integer (nullable) | e.g., 3 for v3 |
| `doi` | text (nullable) | Unique |
| `title` | text | Not null |
| `abstract` | text (nullable) | |
| `pdfUrl` | text (nullable) | arXiv URL or Vercel Blob URL |
| `pdfSource` | text (nullable) | CHECK: `arxiv`, `upload`, or `external` |
| `journalName` | text (nullable) | |
| `volume` | text (nullable) | |
| `issue` | text (nullable) | |
| `pages` | text (nullable) | |
| `publishedYear` | integer (nullable) | CHECK: 1900-2100 |
| `publishedMonth` | integer (nullable) | CHECK: 1-12 |
| `publishedDay` | integer (nullable) | CHECK: 1-31 |
| `authorIds` | UUID[] | Ordered array referencing Authors.id. No FK constraint (Postgres limitation on arrays). |
| `tagIds` | UUID[] | Referencing Tags.id. No FK constraint. |
| `status` | text | CHECK: `draft` or `published`. Not null |
| `deletedAt` | timestamp (nullable) | Soft deletes |
| `createdAt` | timestamp | Not null, default now |
| `updatedAt` | timestamp | Not null, auto-updated via DB trigger |

**CHECK constraints:**
- Erratum/parent: `(type = 'erratum' AND parentId IS NOT NULL) OR (type != 'erratum' AND parentId IS NULL)`
- PDF source/arXiv: `(pdfSource != 'arxiv') OR (arxivId IS NOT NULL)`
- PDF source/upload: `(pdfSource != 'upload') OR (pdfUrl IS NOT NULL)`
- PDF source/external: `(pdfSource != 'external') OR (pdfUrl IS NOT NULL)`
- Published day range: CHECK 1-31 is a range guard only. Application-level Zod validation must reject impossible calendar dates (e.g., February 30) when year, month, and day are all provided.

**Indexes:**
- GIN index on `authorIds`
- GIN index on `tagIds`
- Index on `status`

**Trigger:**
- `set_updated_at()` — BEFORE UPDATE, sets `updatedAt = now()`

**Design notes:**
- Enums implemented as `text` columns with CHECK constraints (not Postgres enums) for easier migration.
- `publishedYear`/`publishedMonth`/`publishedDay` as separate nullable columns instead of a single date + precision enum. Display logic: all three → "March 15, 2024"; year + month → "March 2024"; year only → "2024".
- Sorting: `publishedYear DESC, publishedMonth DESC NULLS LAST, publishedDay DESC NULLS LAST, createdAt DESC`.
- **Soft-delete cascade rules** (implemented in application layer, not DB triggers):
  - Soft-deleting a parent article cascades soft-delete to its errata.
  - Restoring a parent from trash restores errata that were soft-deleted solely as a result of the parent's cascade. Errata that were independently soft-deleted before the parent deletion are not restored.
  - An erratum cannot be independently restored while its parent is in trash.
  - Publishing/unpublishing a parent does not cascade to errata (errata have independent status).
- **Referential integrity for UUID[] arrays** (application-level, in server actions):
  - Insert/update actions must validate that all `authorIds` reference existing Authors rows.
  - Insert/update actions must validate that all `tagIds` reference existing Tags rows.
  - Deleting an author is blocked if any article's `authorIds` contains that author's ID.
  - Deleting a tag is blocked if any article's `tagIds` contains that tag's ID.

### Authors

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | PK, default random |
| `name` | text | Not null. Display name (preferred spelling) |
| `openAlexId` | text (nullable) | Unique |
| `orcid` | text (nullable) | Unique |
| `affiliation` | text (nullable) | Current institution |
| `homepage` | text (nullable) | Personal URL |
| `createdAt` | timestamp | Not null, default now |
| `updatedAt` | timestamp | Not null, auto-updated via DB trigger |

**Application-level guard:** Deleting an author is blocked if any article's `authorIds` array contains that author's ID.

### Tags

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | PK, default random |
| `name` | text | Not null. e.g., `"37A20"`, `"math.DS"`, `"orbit equivalence"` |
| `type` | text | CHECK: `keyword`, `arxiv_subject`, or `msc_code`. Not null |

**Design notes:** Tags are stored for future use (v2 filtering). Not exposed on the public page in v1.

---

## Application Architecture

### Directory structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx             # Homepage: bio + chronological article list
│   │   └── layout.tsx           # Public layout (navbar, footer)
│   ├── admin/
│   │   ├── layout.tsx           # Admin layout with sidebar nav
│   │   ├── page.tsx             # Dashboard overview
│   │   ├── preview/page.tsx     # Public page preview (drafts visible)
│   │   ├── articles/
│   │   │   ├── page.tsx         # Article list table
│   │   │   ├── new/page.tsx     # Add article form (also handles erratum creation via ?parentId=<id> query param)
│   │   │   └── [id]/page.tsx    # Edit article form
│   │   └── authors/
│   │       ├── page.tsx         # Author list
│   │       └── [id]/page.tsx    # Edit author
│   └── layout.tsx               # Root layout
├── lib/
│   ├── db/
│   │   ├── schema.ts            # Drizzle schema
│   │   ├── index.ts             # Neon client + Drizzle instance
│   │   └── migrations/          # Generated by drizzle-kit
│   ├── auth.ts                  # NextAuth config
│   ├── actions/
│   │   ├── articles.ts          # Article CRUD server actions
│   │   ├── authors.ts           # Author CRUD server actions
│   │   └── fetch-metadata.ts    # arXiv/CrossRef/OpenAlex fetch actions
│   ├── fetchers/
│   │   ├── arxiv.ts             # arXiv Atom XML parser
│   │   ├── crossref.ts          # CrossRef JSON parser
│   │   └── openalex.ts          # OpenAlex JSON parser
│   ├── validators/
│   │   ├── article.ts           # Zod schemas for article input
│   │   └── author.ts            # Zod schemas for author input
│   └── types.ts                 # Shared TypeScript types
├── components/
│   ├── public/                  # Public page components
│   └── admin/                   # Admin components
└── middleware.ts                # Auth guard for /admin/*
```

### Auth

- NextAuth.js with GitHub provider
- `middleware.ts` protects all `/admin/*` routes
- Only the configured GitHub username (`ALLOWED_GITHUB_USERNAME` env var) is granted access
- Defense-in-depth: admin layout also performs a server-side session check
- Comparison is case-insensitive

### Data fetching

- **Public pages**: Server components query Postgres via `unstable_cache` with `tags: ['articles']`. On-demand revalidation via `revalidateTag('articles')` called in publish/unpublish/delete/restore server actions. No segment-level `revalidate` — all cache invalidation is on-demand.
- **Admin pages**: Server components for reads (no caching), server actions for mutations.

### Metadata fetching (server actions, not API routes)

All metadata fetching happens via server actions (protected by auth). No public API routes for fetching.

**Fetcher requirements:**
- All fetchers set `User-Agent: AcademicHomepage/1.0 (mailto:<configured-email>)` for polite pool access
- arXiv fetcher normalizes IDs to bare format before storage (handles both `2301.12345` and `math/0601234` formats)
- arXiv fetcher respects 3-second delay between requests
- Zod validation on all external API responses
- arXiv fetcher extracts version number for `arxivVersion` field

### PDF handling

- **arXiv papers**: PDF URL auto-populated from arXiv metadata. `pdfSource = 'arxiv'`.
- **Non-arXiv papers and errata**: Upload to Vercel Blob from admin form. `pdfSource = 'upload'`.
- **External URLs**: Manually entered URL. `pdfSource = 'external'`.

### Error handling

Server actions return `{ success: true, data: ... }` or `{ success: false, error: string }`. Defined in `lib/types.ts`, used uniformly.

---

## Admin UI

### Viewport

Admin is designed for desktop and tablet (768px+). Screens below 768px show a viewport warning.

### Adding an article

1. Navigate to `/admin/articles/new`
2. Enter an arXiv ID or DOI
3. Click **Fetch** — server action calls arXiv/CrossRef, returns metadata
4. All fields auto-populate: title, abstract, authors, tags, PDF URL, journal info, date, arXiv version
5. **Author matching**: Fetched authors are matched against existing DB records in this order: (a) by ORCID if available (CrossRef and OpenAlex provide ORCID; arXiv does not), (b) by case-insensitive normalized Unicode name comparison. If no exact match, the UI presents top candidates with edit distance ≤ 2 for manual selection. A confirmation step shows: "These authors matched existing records / These appear new — confirm or reassign." New authors are created only on user confirmation.
6. Review and edit any field
7. **Re-fetch**: After initial fetch, button changes to "Re-fetch (will overwrite edits)" with a warning. Re-fetch overwrites all editable fields and re-runs the author matching confirmation step with fresh results. Authors created during a prior fetch are not deleted (they may be referenced elsewhere).
8. Click **Save as Draft** or **Publish**

### Adding an erratum

From an article's edit page, click **[+ Add Erratum]**. This navigates to `/admin/articles/new?parentId=<id>`, which renders a streamlined erratum form:

- **File upload is the default and most prominent action**
- Title pre-filled with "Erratum to [parent title]" (editable)
- Authors pre-populated from parent article (editable — allows subset or additions)
- DOI + journal fields collapsed under "Optional" section (for formally published errata)
- No arXiv ID field
- `parentId` and `type = erratum` set automatically

### Article list

`/admin/articles` shows all articles in a table:
- Columns: title, type, status, year, actions
- Below 1024px: collapses to card-list with title + status badge + kebab action menu
- Actions: edit, add erratum, publish/unpublish (with confirmation dialog), soft delete
- Separate **Trash** tab showing soft-deleted articles with restore option
- Soft-deleted parent articles show their errata grouped with them in trash

### Author management

`/admin/authors`:
- List all authors with name, affiliation, article count
- Edit: name, affiliation, external IDs (OpenAlex, ORCID), homepage
- Re-fetch button to update from OpenAlex
- View which articles reference each author
- Delete blocked if any articles reference the author

### Preview mode

`/admin/preview` renders the public homepage with draft articles included (visually marked as drafts). Allows reviewing before publishing.

---

## Public Site

### Layout

Single-page layout:
- **Navbar**: Name, navigation links (Publications, Lecture Notes)
- **Hero section**: Photo, name, title, institution, research interests, area tags (hardcoded for now)
- **Publications**: Flat chronological list, most recent first
- **Lecture Notes**: Static section (hardcoded for now, CMS-managed in future)
- **Footer**: Contact info (hardcoded)

### Article display

Each article shows:
- **Title** (with KaTeX math rendering)
- **All authors** in stored order
- **Publication info**: "Journal Name, Vol X, Issue Y (Year), pages" for published; "Preprint, arXiv:XXXX.XXXXX vN" for preprints
- **Links row**: [arXiv] [DOI] [PDF] [BibTeX] — shown only when data exists. Tap targets minimum 44px on mobile.
- **Expandable abstract**: Collapsed by default, toggle via `<button>` with `aria-expanded`. KaTeX rendering inside.
- **Errata**: Displayed as compact badge beneath parent article — "Erratum (date)" with PDF/DOI links. Not a nested card. No expand toggle if abstract is null.

### BibTeX export

Each article has a [BibTeX] link that generates a downloadable `.bib` file. Generated client-side from article metadata (no server route needed).

**Format rules:**
- Entry type: `@article` for published, `@unpublished` for preprints, `@misc` for errata
- Citation key: `LastName` + `Year` (first author's last name + published year, e.g., `Slutsky2024`). If `publishedYear` is null, use the four-digit year from `createdAt`. Disambiguate with `a`, `b` suffix if needed.
- Author field: `{Last1, First1 and Last2, First2 and ...}` (standard BibTeX format)
- Fields included when available: `title`, `author`, `journal`, `volume`, `number` (issue), `pages`, `year`, `doi`, `eprint` (arXiv ID), `archivePrefix` (arXiv), `primaryClass` (arXiv subject), `abstract`
- Fields omitted when null (no empty fields in output)

### Responsive design

- **Desktop (1024px+)**: Full layout with generous whitespace, inline links row
- **Tablet (768px-1023px)**: Narrower content column, same structure
- **Mobile (<768px)**: Single-column, no card borders/shadows, compact article display. Link buttons have increased padding for touch targets (44px minimum). Errata shown as single-line badge.

### Accessibility

- Visible focus rings on all interactive elements
- Abstract expand toggle uses `<button>` with `aria-expanded` (native `<button>` provides `role` and `tabindex` implicitly)
- KaTeX via rehype-katex + remark-math for SSR-compatible rendering with MathML fallback
- Abstracts use inline expand/collapse pattern (no modal)
- Color contrast meets WCAG AA (4.5:1 minimum for body text)

### Caching

- Public page DB queries wrapped in `unstable_cache` with `tags: ['articles']`
- `revalidateTag('articles')` called by admin publish/unpublish/delete/restore actions for immediate cache invalidation
- No segment-level `revalidate` — all invalidation is on-demand via tags

---

## Future extensions (not in v1)

- Filtering/sorting on public page by tags, arXiv subjects, MSC codes
- Topic/section grouping of articles
- Teaching history section with CMS management
- CMS-managed bio/contact section
- Bulk admin operations
- Mobile-responsive admin
- Settings key-value store for site configuration
