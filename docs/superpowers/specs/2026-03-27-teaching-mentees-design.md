# Teaching & Mentees Tabs — Design Spec

## Overview

Add two new content sections (Teaching, Students) to the academic homepage, organized under a tab-based navigation that separates research content from academic/mentoring content.

## Goals

- Display teaching history grouped by institution, chronological within each group
- Display mentees (PhD, postdoc, master's, undergraduate) grouped by category
- Tab-based navigation separating Research and Academic content
- Admin CRUD for both courses and mentees
- URL hash routing so direct links to sections work

## Non-goals

- Course descriptions or syllabus links (not in v1)
- Automated data fetching for courses or mentees (manual entry only)

---

## Navigation Structure

Two top-level tabs below the hero section (hero always visible above tabs):

```
[Hero — always visible]
[Research]  [Academic]
```

- **Research tab**: Preprints, Publications, Lecture Notes (existing content, unchanged)
- **Academic tab**: Teaching, Students

### Tab behavior

- Tab state is a client-side component, driven by URL hash
- Hash routing: `#preprints`, `#publications`, `#lecture-notes` activate Research tab. `#teaching`, `#students` activate Academic tab. Default (no hash): Research tab.
- Navbar anchor links update based on active tab:
  - Research active: Preprints | Publications | Lecture Notes
  - Academic active: Teaching | Students

### Component architecture for tab/navbar interaction

The current `Navbar` is a server component with hardcoded links. To make it respond to tab state:

1. Create a new client component `TabProvider` that wraps the entire public page content (below hero). It reads `window.location.hash` on mount and listens to `hashchange` events. It provides the active tab via React context.
2. Convert `Navbar` to a client component (or extract the links portion as a client component) that consumes tab context and renders the appropriate anchor links.
3. The tab bar itself is part of the `TabProvider` component, rendered between hero and content.

The `TabProvider` component owns: tab state, hash routing, tab bar rendering, and context for navbar link swapping.

### Tab styling

- Tab bar: sticky below navbar, `sticky top-14 z-30 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200` (top-14 matches navbar height h-14, z-30 is below navbar z-40)
- Active tab: `border-b-2 border-indigo-600 text-indigo-700`
- Inactive tab: `text-stone-500 hover:text-stone-800`
- Container: `flex gap-6 max-w-3xl mx-auto px-4 pt-2`
- Mobile: tab labels "Research" and "Academic" are short enough to fit at 375px. Navbar anchor links on mobile are hidden and accessible via a hamburger menu or simply omitted (the tab bar provides sufficient navigation on small screens).

---

## Database Schema

### Courses table

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | PK, default random |
| `courseNumber` | text | Not null. e.g., "MATH 414" |
| `courseTitle` | text | Not null. e.g., "Analysis I" |
| `semester` | text | Not null. e.g., "Fall", "Spring", "Summer" |
| `year` | integer | Not null. CHECK: 1900-2100 |
| `institution` | text | Not null. e.g., "Iowa State University" |
| `status` | text | CHECK: `draft` / `published`. Not null, default `draft` |
| `deletedAt` | timestamp (nullable) | Soft deletes |
| `createdAt` | timestamp | Not null, default now |
| `updatedAt` | timestamp | Not null, auto-updated via DB trigger |

**Indexes:** Index on `status`, index on `institution`.

### Mentees table

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | UUID | PK, default random |
| `name` | text | Not null |
| `category` | text | CHECK: `phd` / `postdoc` / `masters` / `undergraduate`. Not null |
| `institution` | text | Not null. e.g., "Iowa State University" |
| `startYear` | integer | Not null. CHECK: 1900-2100 |
| `endYear` | integer (nullable) | CHECK: IS NULL OR (1900-2100). Null = current student |
| `thesisTitle` | text (nullable) | For graduated PhD/MS students |
| `firstPosition` | text (nullable) | Position immediately after graduation, e.g., "Postdoc at MIT" |
| `homepage` | text (nullable) | Personal URL |
| `status` | text | CHECK: `draft` / `published`. Not null, default `draft` |
| `deletedAt` | timestamp (nullable) | Soft deletes |
| `createdAt` | timestamp | Not null, default now |
| `updatedAt` | timestamp | Not null, auto-updated via DB trigger |

**Indexes:** Index on `status`, index on `category`.

Both tables get the same `set_updated_at()` trigger as existing tables. All `timestamp` columns are without timezone, matching existing schema convention.

---

## Public Display

### Teaching section

Grouped by institution. Within each institution, reverse chronological (most recent first). Sorted by `year DESC`, then semester order (Fall > Summer > Spring).

**Semester sort implementation:** Use a Drizzle `sql` fragment for the ORDER BY:
```sql
ORDER BY year DESC, CASE semester WHEN 'Fall' THEN 1 WHEN 'Summer' THEN 2 WHEN 'Spring' THEN 3 END ASC
```

```
Iowa State University
─────────────────────────────────────────────────────
MATH 414   Analysis I                     Fall 2024
MATH 301   Real Analysis I                Spring 2024
MATH 201   Calculus III                   Fall 2023

University of Illinois Chicago
─────────────────────────────────────────────────────
MATH 535   Descriptive Set Theory         Spring 2020
```

Layout per course row: `grid grid-cols-[5rem_1fr_auto] items-baseline gap-x-3 py-1.5`

- Course number: `font-mono text-sm font-semibold text-indigo-600`
- Course title: `text-sm text-stone-800`
- Semester + year: `text-xs text-stone-400 whitespace-nowrap`, right-aligned

Institution heading: same style as section headings but smaller — `text-lg font-semibold text-stone-800 mt-8 first:mt-0`

Divider beneath heading: `border-b border-stone-200 pb-2 mb-3`

On mobile (< 640px): course rows stack vertically (`flex-col`), semester drops below title.

### Students section

Grouped by category in this order: PhD Students, Postdocs, Master's Students, Undergraduate Research. Only show categories that have entries.

Within each category, current students first (endYear is null), then former students by endYear descending.

```
PhD Students
  Alice Smith          Iowa State, 2022–present
  Bob Jones            Iowa State, 2019–2023
                       Thesis: "On Borel Complexity of..."
                       Now: Postdoc at University of Michigan
```

- Name: `text-sm font-medium text-stone-800`. Link to homepage when available (using indigo link style).
- Institution + years: `text-xs text-stone-400`
- Thesis title: `text-xs text-stone-500 italic`, shown only when non-null
- First position: `text-xs text-stone-500`, prefixed with "Now: ", shown only when non-null

Category heading: `text-lg font-semibold text-stone-800 mt-8 first:mt-0`

Spacing between mentee entries: `space-y-3`

Only `status = 'published'` and `deletedAt IS NULL` entries shown on public page.

---

## Admin Pages

### Sidebar

Add two new nav items to the admin sidebar:
- Courses (under a "Academic" group label)
- Mentees (under the same group)

### `/admin/courses`

- Table listing all courses: course number, title, semester+year, institution, status, actions
- "New Course" button
- Trash tab (same pattern as articles)

### `/admin/courses/new` and `/admin/courses/[id]`

Simple form with fields: course number, course title, semester (dropdown: Fall/Spring/Summer), year, institution. Save as Draft / Publish buttons.

### `/admin/mentees`

- Table listing all mentees: name, category, institution, years, status, actions
- "New Mentee" button
- Trash tab

### `/admin/mentees/new` and `/admin/mentees/[id]`

Form with fields: name, category (dropdown: PhD/Postdoc/Master's/Undergraduate), institution, start year, end year (optional), thesis title (optional, shown when category is PhD or Master's), first position (optional), homepage (optional). Save as Draft / Publish buttons.

---

## Caching

Public page queries for courses and mentees use a **separate** `unstable_cache` call from the existing articles cache. The existing cache uses key `["published-articles"]` with tag `"articles"`. The new cache uses key `["academic-data"]` with tag `"academic"`. This ensures article mutations don't invalidate academic data and vice versa.

```typescript
const getAcademicData = unstable_cache(
  async () => { /* courses + mentees queries */ },
  ["academic-data"],
  { tags: ["academic"] }
);
```

Course and mentee mutation server actions call `revalidateTag('academic')`.

---

## Future extensions

- Course syllabus/website links
- Mentee research interest or project description
- Photo for mentees
