# Teaching & Mentees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Teaching and Students sections to the academic homepage under a tab-based navigation, with admin CRUD for courses and mentees.

**Architecture:** Two new DB tables (courses, mentees) with Drizzle schema. Server actions for CRUD. Tab-based public page splitting Research and Academic content. Client-side TabProvider manages tab state via URL hash and React context. Navbar links update dynamically based on active tab.

**Tech Stack:** Next.js App Router, Drizzle ORM, Neon Postgres, Tailwind CSS, Zod

**Spec:** `docs/superpowers/specs/2026-03-27-teaching-mentees-design.md`

---

## File Map

### New files

```
src/
├── lib/
│   ├── db/
│   │   └── schema.ts                          # MODIFY: add courses + mentees tables
│   ├── actions/
│   │   ├── courses.ts                         # Course CRUD server actions
│   │   └── mentees.ts                         # Mentee CRUD server actions
│   ├── validators/
│   │   ├── course.ts                          # Zod schema for course input
│   │   └── mentee.ts                          # Zod schema for mentee input
│   └── types.ts                               # MODIFY: add SEMESTERS, MENTEE_CATEGORIES
├── components/
│   ├── public/
│   │   ├── tab-provider.tsx                   # Client: tab state, hash routing, context
│   │   ├── teaching-list.tsx                  # Server: courses grouped by institution
│   │   ├── mentee-list.tsx                    # Server: mentees grouped by category
│   │   └── navbar.tsx                         # MODIFY: consume tab context for links
│   └── admin/
│       ├── sidebar.tsx                        # MODIFY: add Courses + Mentees nav items
│       ├── course-table.tsx                   # Client: course list with actions
│       ├── course-form.tsx                    # Client: course create/edit form
│       ├── mentee-table.tsx                   # Client: mentee list with actions
│       └── mentee-form.tsx                    # Client: mentee create/edit form
├── app/
│   ├── (public)/
│   │   └── page.tsx                           # MODIFY: add TabProvider, academic content
│   └── admin/
│       ├── courses/
│       │   ├── page.tsx                       # Course list page
│       │   ├── new/page.tsx                   # New course page
│       │   └── [id]/page.tsx                  # Edit course page
│       └── mentees/
│           ├── page.tsx                       # Mentee list page
│           ├── new/page.tsx                   # New mentee page
│           └── [id]/page.tsx                  # Edit mentee page
```

---

## Task Dependency Graph

```
Task 1 (Schema + Types)
  └── Task 2 (Validators)
        ├── Task 3 (Course Actions)
        │     └── Task 5 (Course Admin Pages)
        ├── Task 4 (Mentee Actions)
        │     └── Task 6 (Mentee Admin Pages)
        └── Task 7 (TabProvider + Navbar)
              └── Task 8 (Public Teaching + Students display)
                    └── Task 9 (Admin Sidebar + Preview update)
```

**Parallelizable:** Tasks 3+4 (both actions, after Task 2), Tasks 5+6 (both admin UIs), Task 7 (independent of 3-6)

---

## Task 1: Schema + Types

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Add type constants**

Add to `src/lib/types.ts`:

```typescript
export const SEMESTERS = ["Fall", "Spring", "Summer"] as const;
export type Semester = (typeof SEMESTERS)[number];

export const MENTEE_CATEGORIES = ["phd", "postdoc", "masters", "undergraduate"] as const;
export type MenteeCategory = (typeof MENTEE_CATEGORIES)[number];
```

- [ ] **Step 2: Add courses table to schema**

Add to `src/lib/db/schema.ts`:

```typescript
export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseNumber: text("course_number").notNull(),
    courseTitle: text("course_title").notNull(),
    semester: text("semester").notNull(),
    year: integer("year").notNull(),
    institution: text("institution").notNull(),
    status: text("status").notNull().default("draft"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("courses_status_idx").on(table.status),
    index("courses_institution_idx").on(table.institution),
    check("courses_status_check", sql`${table.status} IN ('draft', 'published')`),
    check("courses_semester_check", sql`${table.semester} IN ('Fall', 'Spring', 'Summer')`),
    check("courses_year_check", sql`${table.year} >= 1900 AND ${table.year} <= 2100`),
  ]
);
```

- [ ] **Step 3: Add mentees table to schema**

Add to `src/lib/db/schema.ts`:

```typescript
export const mentees = pgTable(
  "mentees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    institution: text("institution").notNull(),
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year"),
    thesisTitle: text("thesis_title"),
    firstPosition: text("first_position"),
    homepage: text("homepage"),
    status: text("status").notNull().default("draft"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("mentees_status_idx").on(table.status),
    index("mentees_category_idx").on(table.category),
    check("mentees_status_check", sql`${table.status} IN ('draft', 'published')`),
    check("mentees_category_check", sql`${table.category} IN ('phd', 'postdoc', 'masters', 'undergraduate')`),
    check("mentees_start_year_check", sql`${table.startYear} >= 1900 AND ${table.startYear} <= 2100`),
    check("mentees_end_year_check", sql`${table.endYear} IS NULL OR (${table.endYear} >= 1900 AND ${table.endYear} <= 2100)`),
  ]
);
```

- [ ] **Step 4: Push schema and add triggers**

```bash
npx drizzle-kit push
```

Then run triggers for the new tables (via Neon console or a script):

```sql
CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER mentees_set_updated_at
  BEFORE UPDATE ON mentees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add courses and mentees database tables"
```

---

## Task 2: Validators

**Files:**
- Create: `src/lib/validators/course.ts`
- Create: `src/lib/validators/mentee.ts`

- [ ] **Step 1: Create course validator**

```typescript
import { z } from "zod";
import { SEMESTERS, ARTICLE_STATUSES } from "@/lib/types";

export const courseCreateSchema = z.object({
  courseNumber: z.string().min(1, "Course number is required"),
  courseTitle: z.string().min(1, "Course title is required"),
  semester: z.enum(SEMESTERS),
  year: z.number().int().min(1900).max(2100),
  institution: z.string().min(1, "Institution is required"),
  status: z.enum(ARTICLE_STATUSES).default("draft"),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
```

- [ ] **Step 2: Create mentee validator**

```typescript
import { z } from "zod";
import { MENTEE_CATEGORIES, ARTICLE_STATUSES } from "@/lib/types";

export const menteeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(MENTEE_CATEGORIES),
  institution: z.string().min(1, "Institution is required"),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100).optional(),
  thesisTitle: z.string().optional(),
  firstPosition: z.string().optional(),
  homepage: z.string().url().optional().or(z.literal("")),
  status: z.enum(ARTICLE_STATUSES).default("draft"),
});

export type MenteeCreateInput = z.infer<typeof menteeCreateSchema>;
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Zod validators for courses and mentees"
```

---

## Task 3: Course Server Actions

**Files:**
- Create: `src/lib/actions/courses.ts`

- [ ] **Step 1: Implement course actions**

Create `src/lib/actions/courses.ts` with `"use server"` directive. Follow the exact same pattern as `src/lib/actions/articles.ts` (which has soft-delete, toggle status, try/catch, revalidateTag):

- `createCourse(input: unknown): Promise<ActionResult<{ id: string }>>` — validate, insert, return id
- `updateCourse(id: string, input: unknown): Promise<ActionResult>` — validate, update, `revalidateTag("academic")`
- `softDeleteCourse(id: string): Promise<ActionResult>` — set deletedAt, `revalidateTag("academic")`
- `restoreCourse(id: string): Promise<ActionResult>` — clear deletedAt, `revalidateTag("academic")`
- `toggleCourseStatus(id: string): Promise<ActionResult>` — flip draft/published, `revalidateTag("academic")`
- `getCourses(includeDeleted?: boolean)` — ordered by institution, then `year DESC, CASE semester WHEN 'Fall' THEN 1 WHEN 'Summer' THEN 2 WHEN 'Spring' THEN 3 END ASC`
- `getPublishedCourses()` — status=published, deletedAt IS NULL, same ordering
- `getCourse(id: string)` — single by id

All mutations call `requireAuth()`. Wrap DB operations in try/catch returning ActionResult on error.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add course CRUD server actions"
```

---

## Task 4: Mentee Server Actions

**Files:**
- Create: `src/lib/actions/mentees.ts`

- [ ] **Step 1: Implement mentee actions**

Same pattern as courses. Create `src/lib/actions/mentees.ts`:

- `createMentee`, `updateMentee`, `softDeleteMentee`, `restoreMentee`, `toggleMenteeStatus`
- `getMentees(includeDeleted?)` — ordered by category (CASE: phd=1, postdoc=2, masters=3, undergraduate=4), then endYear IS NULL first (current students), then endYear DESC
- `getPublishedMentees()` — status=published, deletedAt IS NULL, same ordering
- `getMentee(id: string)`

All mutations call `revalidateTag("academic")`.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "feat: add mentee CRUD server actions"
```

---

## Task 5: Course Admin Pages

**Files:**
- Create: `src/components/admin/course-table.tsx`
- Create: `src/components/admin/course-form.tsx`
- Create: `src/app/admin/courses/page.tsx`
- Create: `src/app/admin/courses/[id]/page.tsx`

- [ ] **Step 1: Create course table component**

Client component. Same pattern as `src/components/admin/article-table.tsx`. Table with columns: course number, title, semester+year, institution, status badge, actions (edit, publish/unpublish with confirm, delete). Trash tab with restore. Follow the existing admin design system (stone borders, indigo primary buttons, etc.).

- [ ] **Step 2: Create course form component**

Client component. Fields: course number (text), course title (text), semester (dropdown: Fall/Spring/Summer), year (number), institution (text). Save as Draft + Publish buttons with confirm dialog. Follow existing form styling from `src/components/admin/author-form.tsx`.

- [ ] **Step 3: Create course list page**

Server component at `src/app/admin/courses/page.tsx`. Reads `?tab=trash` search param. Fetches courses via `getCourses()`. Renders tab navigation + CourseTable + "New Course" link.

- [ ] **Step 4: Create course new page**

Server component at `src/app/admin/courses/new/page.tsx`. Renders empty CourseForm. Matches the existing pattern of `src/app/admin/articles/new/page.tsx`.

- [ ] **Step 5: Create course edit page**

Server component at `src/app/admin/courses/[id]/page.tsx`. Fetches course by ID, renders CourseForm with data. Uses `notFound()` if not found.

- [ ] **Step 5: Verify and commit**

```bash
npm run dev  # test manually: /admin/courses
git add -A
git commit -m "feat: add course admin pages"
```

---

## Task 6: Mentee Admin Pages

**Files:**
- Create: `src/components/admin/mentee-table.tsx`
- Create: `src/components/admin/mentee-form.tsx`
- Create: `src/app/admin/mentees/page.tsx`
- Create: `src/app/admin/mentees/[id]/page.tsx`

- [ ] **Step 1: Create mentee table component**

Client component. Table with columns: name, category badge, institution, years, status badge, actions. Same patterns as course table.

- [ ] **Step 2: Create mentee form component**

Client component. Fields: name, category (dropdown), institution, start year, end year (optional), thesis title (optional — show only when category is `phd` or `masters`), first position (optional), homepage (optional). Save as Draft + Publish buttons.

- [ ] **Step 3: Create mentee list page**

Server component at `src/app/admin/mentees/page.tsx`. Same pattern as courses list.

- [ ] **Step 4: Create mentee new page**

Server component at `src/app/admin/mentees/new/page.tsx`. Renders empty MenteeForm.

- [ ] **Step 5: Create mentee edit page**

Server component at `src/app/admin/mentees/[id]/page.tsx`. Fetches mentee by ID, renders MenteeForm with data. Uses `notFound()` if not found.

- [ ] **Step 5: Verify and commit**

```bash
npm run dev  # test manually: /admin/mentees
git add -A
git commit -m "feat: add mentee admin pages"
```

---

## Task 7: TabProvider + Navbar Conversion

**Files:**
- Create: `src/components/public/tab-provider.tsx`
- Modify: `src/components/public/navbar.tsx`

- [ ] **Step 1: Create TabProvider client component**

**IMPORTANT architectural note:** The `Navbar` must consume tab context to swap its links, but `Navbar` is rendered in `src/app/(public)/layout.tsx` ABOVE the page content. Therefore, the context provider must be lifted to the layout level — it cannot live only in `page.tsx`. Create two components:
- `TabContext` + `TabProvider` (context provider that wraps layout children including Navbar)
- `TabBar` + `TabContent` (rendered inside page.tsx for the tab UI and content switching)

Create `src/components/public/tab-provider.tsx`:

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Tab = "research" | "academic";

const RESEARCH_HASHES = ["#preprints", "#publications", "#lecture-notes"];
const ACADEMIC_HASHES = ["#teaching", "#students"];

function tabFromHash(hash: string): Tab {
  if (ACADEMIC_HASHES.includes(hash)) return "academic";
  return "research";
}

const TabContext = createContext<{
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}>({ activeTab: "research", setActiveTab: () => {} });

export function useTab() {
  return useContext(TabContext);
}

// Provider — wraps the entire public layout (including Navbar) so context is available everywhere
export function TabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>("research");

  useEffect(() => {
    setActiveTab(tabFromHash(window.location.hash));
    const handler = () => setActiveTab(tabFromHash(window.location.hash));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    window.location.hash = tab === "academic" ? "#teaching" : "#preprints";
  }, []);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab: switchTab }}>
      {children}
    </TabContext.Provider>
  );
}

// Tab bar — rendered in page.tsx between hero and content
export function TabBar() {
  const { activeTab, setActiveTab } = useTab();
  const tabClass = (tab: Tab) =>
    `pb-2 text-sm font-medium transition-colors duration-150 ${
      activeTab === tab
        ? "border-b-2 border-indigo-600 text-indigo-700"
        : "text-stone-500 hover:text-stone-800"
    }`;

  return (
    <div className="sticky top-14 z-30 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-6 pt-2">
        <button onClick={() => setActiveTab("research")} className={tabClass("research")}>Research</button>
        <button onClick={() => setActiveTab("academic")} className={tabClass("academic")}>Academic</button>
      </div>
    </div>
  );
}

// Tab content — renders active tab's content, hides inactive
export function TabContent({
  researchContent,
  academicContent,
}: {
  researchContent: React.ReactNode;
  academicContent: React.ReactNode;
}) {
  const { activeTab } = useTab();
  return (
    <>
      <div className={activeTab === "research" ? "" : "hidden"}>{researchContent}</div>
      <div className={activeTab === "academic" ? "" : "hidden"}>{academicContent}</div>
    </>
  );
}
```

- [ ] **Step 2: Convert Navbar to use tab context**

Modify `src/components/public/navbar.tsx`. Extract the links into a client component `NavLinks` that consumes `useTab()` context and renders the appropriate anchor links. Keep the navbar shell as-is.

```tsx
"use client";

import Link from "next/link";
import { useTab } from "./tab-provider";

const researchLinks = [
  { href: "#preprints", label: "Preprints" },
  { href: "#publications", label: "Publications" },
  { href: "#lecture-notes", label: "Lecture Notes" },
];

const academicLinks = [
  { href: "#teaching", label: "Teaching" },
  { href: "#students", label: "Students" },
];

function NavLinks() {
  const { activeTab } = useTab();
  const links = activeTab === "academic" ? academicLinks : researchLinks;

  return (
    <div className="hidden sm:flex items-center gap-6">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors duration-150"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function Navbar() {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-40">
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-widest text-stone-900"
        >
          Konstantin Slutsky
        </Link>
        <NavLinks />
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Wrap public layout with TabProvider**

Modify `src/app/(public)/layout.tsx` to wrap children with `<TabProvider>`:

```tsx
import { TabProvider } from "@/components/public/tab-provider";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <TabProvider>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">{children}</main>
      <Footer />
    </TabProvider>
  );
}
```

This ensures both `Navbar` (which uses `useTab()` for link swapping) and page content (which uses `TabBar` + `TabContent`) share the same context.

- [ ] **Step 4: Verify and commit**

```bash
npm run dev  # test: tabs switch, navbar links update, hash routing works
git add -A
git commit -m "feat: add TabProvider with hash routing and dynamic navbar"
```

---

## Task 8: Public Teaching + Students Display

**Files:**
- Create: `src/components/public/teaching-list.tsx`
- Create: `src/components/public/mentee-list.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Create teaching list component**

Server component. Props: courses array. Groups courses by institution, renders each group with institution heading + divider + course rows. Uses the grid layout from the spec:

```
grid grid-cols-[5rem_1fr_auto] items-baseline gap-x-3 py-1.5
```

Course number: `font-mono text-sm font-semibold text-indigo-600`
Course title: `text-sm text-stone-800`
Semester + year: `text-xs text-stone-400 whitespace-nowrap`

Mobile: `sm:grid` with `flex flex-col` fallback.

- [ ] **Step 2: Create mentee list component**

Server component. Props: mentees array. Groups by category (PhD, Postdocs, Master's, Undergraduate) in that order. Only renders categories with entries. Within each category: current students (endYear null) first, then former by endYear DESC.

Each entry: name (linked to homepage if available), institution + year range, thesis title (if present), first position (if present).

- [ ] **Step 3: Update public page with TabProvider and academic content**

Modify `src/app/(public)/page.tsx`:

- Add `getAcademicData` as a separate `unstable_cache` call with key `["academic-data"]` and tag `"academic"`. Inside the cached function, query the DB directly (do NOT call the server actions — `"use server"` functions are for client→server calls, not server→server). Write the same queries as `getPublishedCourses`/`getPublishedMentees` inline.
- Wrap existing research sections and new academic sections in `<TabProvider researchContent={...} academicContent={...} />`
- Research content: existing Preprints + Publications + Lecture Notes sections
- Academic content: Teaching section (with `<TeachingList>`) + Students section (with `<MenteeList>`)
- Both academic sections get the standard heading + gradient underline treatment

- [ ] **Step 4: Verify and commit**

```bash
npm run dev  # test: tab switching shows/hides content, teaching + students sections render
npx vitest run  # all existing tests pass
git add -A
git commit -m "feat: add public teaching and students display with tab navigation"
```

---

## Task 9: Admin Sidebar + Preview Update

**Files:**
- Modify: `src/components/admin/sidebar.tsx`
- Modify: `src/app/admin/preview/page.tsx`

- [ ] **Step 1: Add nav items to sidebar**

Modify `src/components/admin/sidebar.tsx`. Add a group label "Academic" and two items below it:

```typescript
const navGroups = [
  {
    label: "Content",
    items: [
      { label: "Articles", href: "/admin/articles" },
      { label: "Authors", href: "/admin/authors" },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Courses", href: "/admin/courses" },
      { label: "Mentees", href: "/admin/mentees" },
    ],
  },
  {
    label: null,
    items: [
      { label: "Preview", href: "/admin/preview" },
    ],
  },
];
```

Render group labels as `text-xs font-semibold uppercase tracking-widest text-zinc-500 px-3 pt-6 pb-2`.

- [ ] **Step 2: Update preview page**

Modify `src/app/admin/preview/page.tsx` to also fetch and display courses and mentees (using the same TabProvider pattern as the public page, but with draft items visible and draft badges shown).

- [ ] **Step 3: Verify and commit**

```bash
npm run dev  # test: sidebar shows new items, preview shows academic tab content
git add -A
git commit -m "feat: update admin sidebar and preview with academic sections"
```

---

## Post-Implementation Checklist

- [ ] `npx vitest run` — all existing tests pass
- [ ] `npx tsc --noEmit` — no type errors
- [ ] Tab switching works via clicks and URL hash
- [ ] Direct link `/#teaching` opens Academic tab at Teaching section
- [ ] Navbar links swap between Research and Academic
- [ ] Courses: create, edit, publish, soft-delete, restore from admin
- [ ] Mentees: create, edit, publish, soft-delete, restore from admin
- [ ] Public page shows only published, non-deleted courses and mentees
- [ ] Teaching list groups by institution, sorts by year DESC + semester
- [ ] Students list groups by category, current first then former
- [ ] Preview mode shows draft courses/mentees with badges
