import { db } from "@/lib/db";
import { articles, authors } from "@/lib/db/schema";
import { isNull, sql } from "drizzle-orm";
import { ArticleList } from "@/components/public/article-list";
import { HeroSection } from "@/components/public/hero-section";

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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        <strong>Preview mode</strong> — Draft articles are shown with a visual indicator. This page is only visible to you.
      </div>
      <HeroSection />
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-stone-900">Publications</h2>
        <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
        <div className="mt-8">
          <ArticleList
            articles={allArticles}
            authorMap={authorMap}
            errataByParent={errataByParent}
            showDraftBadge
          />
        </div>
      </section>
    </div>
  );
}
