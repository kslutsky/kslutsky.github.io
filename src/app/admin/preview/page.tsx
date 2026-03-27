import { db } from "@/lib/db";
import { articles, authors, courses, mentees } from "@/lib/db/schema";
import { isNull, sql } from "drizzle-orm";
import { ArticleList } from "@/components/public/article-list";
import { HeroSection } from "@/components/public/hero-section";
import { TabProvider, TabBar, TabContent } from "@/components/public/tab-provider";
import { TeachingList } from "@/components/public/teaching-list";
import { MenteeList } from "@/components/public/mentee-list";

export default async function PreviewPage() {
  // Fetch ALL non-deleted articles (including drafts, excluding errata as top-level)
  const allArticles = await db
    .select()
    .from(articles)
    .where(sql`${articles.type} != 'erratum' AND ${articles.deletedAt} IS NULL`)
    .orderBy(
      sql`${articles.publishedYear} DESC NULLS LAST`,
      sql`${articles.publishedMonth} DESC NULLS LAST`,
      sql`${articles.publishedDay} DESC NULLS LAST`,
      sql`${articles.createdAt} DESC`
    );

  const allErrata = await db
    .select()
    .from(articles)
    .where(sql`${articles.type} = 'erratum' AND ${articles.deletedAt} IS NULL`);

  const allAuthors = await db.select().from(authors);
  const authorMap = new Map(allAuthors.map((a) => [a.id, a]));

  const errataByParent = new Map();
  for (const e of allErrata) {
    if (e.parentId) {
      const list = errataByParent.get(e.parentId) ?? [];
      list.push(e);
      errataByParent.set(e.parentId, list);
    }
  }

  const allCourses = await db.select().from(courses)
    .where(isNull(courses.deletedAt))
    .orderBy(
      courses.institution,
      sql`${courses.year} DESC`,
      sql`CASE ${courses.semester} WHEN 'Fall' THEN 1 WHEN 'Summer' THEN 2 WHEN 'Spring' THEN 3 END ASC`
    );

  const allMentees = await db.select().from(mentees)
    .where(isNull(mentees.deletedAt))
    .orderBy(
      sql`CASE ${mentees.category} WHEN 'phd' THEN 1 WHEN 'postdoc' THEN 2 WHEN 'masters' THEN 3 WHEN 'undergraduate' THEN 4 END ASC`,
      sql`${mentees.endYear} IS NOT NULL`,
      sql`${mentees.endYear} DESC`
    );

  const preprints = allArticles.filter((a) => a.type === "preprint");
  const published = allArticles.filter((a) => a.type === "published");
  const lectureNotes = allArticles.filter((a) => a.type === "lecture_notes");

  // Group courses by institution for preview rendering
  const coursesByInstitution = new Map<string, typeof allCourses>();
  for (const c of allCourses) {
    const group = coursesByInstitution.get(c.institution) ?? [];
    group.push(c);
    coursesByInstitution.set(c.institution, group);
  }

  const CATEGORY_LABELS: Record<string, string> = {
    phd: "PhD Students",
    postdoc: "Postdocs",
    masters: "Master's Students",
    undergraduate: "Undergraduate Research",
  };
  const CATEGORY_ORDER = ["phd", "postdoc", "masters", "undergraduate"];

  const menteesByCategory = new Map<string, typeof allMentees>();
  for (const m of allMentees) {
    const group = menteesByCategory.get(m.category) ?? [];
    group.push(m);
    menteesByCategory.set(m.category, group);
  }

  const researchContent = (
    <>
      {preprints.length > 0 && (
        <section id="preprints" className="mt-16">
          <h2 className="text-2xl font-semibold text-stone-900">Preprints</h2>
          <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
          <div className="mt-8">
            <ArticleList
              articles={preprints}
              authorMap={authorMap}
              errataByParent={errataByParent}
              showDraftBadge
            />
          </div>
        </section>
      )}

      <section id="publications" className="mt-16">
        <h2 className="text-2xl font-semibold text-stone-900">Publications</h2>
        <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
        <div className="mt-8">
          <ArticleList
            articles={published}
            authorMap={authorMap}
            errataByParent={errataByParent}
            showDraftBadge
          />
        </div>
      </section>

      {lectureNotes.length > 0 && (
        <section id="lecture-notes" className="mt-16">
          <h2 className="text-2xl font-semibold text-stone-900">Lecture Notes</h2>
          <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
          <div className="mt-8">
            <ArticleList
              articles={lectureNotes}
              authorMap={authorMap}
              errataByParent={errataByParent}
              showDraftBadge
            />
          </div>
        </section>
      )}
    </>
  );

  const academicContent = (
    <>
      <section id="teaching" className="mt-16">
        <h2 className="text-2xl font-semibold text-stone-900">Teaching</h2>
        <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
        {allCourses.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">No courses listed yet.</p>
        ) : (
          <div className="mt-8 space-y-8">
            {Array.from(coursesByInstitution.entries()).map(([institution, items]) => (
              <div key={institution}>
                <h3 className="text-lg font-semibold text-stone-800 border-b border-stone-200 pb-2 mb-3">
                  {institution}
                </h3>
                <div className="space-y-0">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      className="grid grid-cols-[5rem_1fr_auto] sm:grid items-baseline gap-x-3 py-1.5 max-sm:flex max-sm:flex-col max-sm:gap-0.5"
                    >
                      <span className="font-mono text-sm font-semibold text-indigo-600">{c.courseNumber}</span>
                      <span className="text-sm text-stone-800">
                        {c.courseTitle}
                        {c.status === "draft" && (
                          <span className="ml-2 text-xs text-amber-600 font-medium">(Draft)</span>
                        )}
                      </span>
                      <span className="text-xs text-stone-400 whitespace-nowrap">{c.semester} {c.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="students" className="mt-16">
        <h2 className="text-2xl font-semibold text-stone-900">Students</h2>
        <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
        {allMentees.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">No students listed yet.</p>
        ) : (
          <div className="mt-8 space-y-8">
            {CATEGORY_ORDER.filter((cat) => menteesByCategory.has(cat)).map((cat) => (
              <div key={cat}>
                <h3 className="text-lg font-semibold text-stone-800 mb-3">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="space-y-3">
                  {menteesByCategory.get(cat)!.map((m) => (
                    <div key={m.id}>
                      <div className="flex items-baseline gap-3">
                        {m.homepage ? (
                          <a
                            href={m.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600 transition-colors"
                          >
                            {m.name}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-stone-800">{m.name}</span>
                        )}
                        <span className="text-xs text-stone-400">
                          {m.institution}, {m.startYear}&ndash;{m.endYear ?? "present"}
                        </span>
                        {m.status === "draft" && (
                          <span className="text-xs text-amber-600 font-medium">(Draft)</span>
                        )}
                      </div>
                      {m.thesisTitle && (
                        <p className="mt-0.5 ml-0 text-xs text-stone-500 italic">
                          Thesis: &ldquo;{m.thesisTitle}&rdquo;
                        </p>
                      )}
                      {m.firstPosition && (
                        <p className="mt-0.5 ml-0 text-xs text-stone-500">
                          Now: {m.firstPosition}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );

  return (
    <TabProvider>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>Preview mode</strong> — Draft items are shown with a visual indicator. This page is only visible to you.
        </div>
        <HeroSection />
        <TabBar />
        <TabContent
          researchContent={researchContent}
          academicContent={academicContent}
        />
      </div>
    </TabProvider>
  );
}
