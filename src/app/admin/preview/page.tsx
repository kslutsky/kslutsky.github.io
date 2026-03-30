import { db } from "@/lib/db";
import { articles, authors, courses, mentees } from "@/lib/db/schema";
import { isNull, sql, desc } from "drizzle-orm";
import { ArticleList } from "@/components/public/article-list";
import { HeroSection } from "@/components/public/hero-section";
import { TeachingList } from "@/components/public/teaching-list";
import { MenteeList } from "@/components/public/mentee-list";

export default async function PreviewPage() {
  const allArticles = await db
    .select()
    .from(articles)
    .where(sql`${articles.type} NOT IN ('erratum', 'lecture_notes') AND ${articles.deletedAt} IS NULL`)
    .orderBy(
      sql`${articles.publishedYear} DESC NULLS LAST`,
      sql`${articles.publishedMonth} DESC NULLS LAST`,
      sql`${articles.publishedDay} DESC NULLS LAST`,
      desc(articles.createdAt)
    );

  const allErrata = await db
    .select()
    .from(articles)
    .where(sql`${articles.type} = 'erratum' AND ${articles.deletedAt} IS NULL`);

  const lectureNotes = await db
    .select()
    .from(articles)
    .where(sql`${articles.type} = 'lecture_notes' AND ${articles.deletedAt} IS NULL`)
    .orderBy(desc(articles.createdAt));

  const allAuthors = await db.select().from(authors);
  const authorMap = new Map(allAuthors.map((a) => [a.id, a]));

  const errataByParent = new Map<string, (typeof allErrata)[number][]>();
  for (const e of allErrata) {
    if (e.parentId) {
      const list = errataByParent.get(e.parentId) ?? [];
      list.push(e);
      errataByParent.set(e.parentId, list);
    }
  }

  const preprints = allArticles.filter((a) => a.type === "preprint");
  const published = allArticles.filter((a) => a.type === "published");

  const allCourses = await db
    .select()
    .from(courses)
    .where(isNull(courses.deletedAt))
    .orderBy(
      courses.institution,
      sql`${courses.year} DESC`,
      sql`CASE ${courses.semester} WHEN 'Fall' THEN 1 WHEN 'Summer' THEN 2 WHEN 'Spring' THEN 3 END ASC`
    );

  const allMentees = await db
    .select()
    .from(mentees)
    .where(isNull(mentees.deletedAt))
    .orderBy(
      sql`CASE ${mentees.category} WHEN 'phd' THEN 1 WHEN 'postdoc' THEN 2 WHEN 'masters' THEN 3 WHEN 'undergraduate' THEN 4 END ASC`,
      sql`${mentees.endYear} IS NOT NULL`,
      sql`${mentees.endYear} DESC`
    );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        <strong>Preview mode</strong> — Draft items are shown with a visual indicator. This page is only visible to you.
      </div>

      {preprints.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-6">Preprints</h2>
          <ArticleList articles={preprints} authorMap={authorMap} errataByParent={errataByParent} showDraftBadge />
        </section>
      )}

      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-6">Publications</h2>
        <ArticleList articles={published} authorMap={authorMap} errataByParent={errataByParent} showDraftBadge />
      </section>

      {lectureNotes.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-6">Notes</h2>
          <ArticleList articles={lectureNotes} authorMap={authorMap} errataByParent={errataByParent} showDraftBadge />
        </section>
      )}

      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-6">Mentees</h2>
        <MenteeList mentees={allMentees} />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-6">Teaching</h2>
        <TeachingList courses={allCourses} />
      </section>
    </div>
  );
}
