import { unstable_cache } from "next/cache";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, authors } from "@/lib/db/schema";
import { HeroSection } from "@/components/public/hero-section";
import { ArticleList } from "@/components/public/article-list";

const getPublishedData = unstable_cache(
  async () => {
    const allArticles = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          isNull(articles.deletedAt),
          sql`${articles.type} NOT IN ('erratum', 'lecture_notes')`
        )
      )
      .orderBy(
        sql`${articles.publishedYear} DESC NULLS LAST`,
        sql`${articles.publishedMonth} DESC NULLS LAST`,
        sql`${articles.publishedDay} DESC NULLS LAST`,
        desc(articles.createdAt)
      );

    const allErrata = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.type, "erratum"),
          eq(articles.status, "published"),
          isNull(articles.deletedAt)
        )
      );

    const lectureNotes = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.type, "lecture_notes"),
          eq(articles.status, "published"),
          isNull(articles.deletedAt)
        )
      )
      .orderBy(
        sql`${articles.publishedYear} DESC NULLS LAST`,
        desc(articles.createdAt)
      );

    const allAuthors = await db.select().from(authors);

    return {
      articles: allArticles,
      errata: allErrata,
      lectureNotes,
      authors: allAuthors,
    };
  },
  ["published-articles"],
  { tags: ["articles"] }
);

export default async function HomePage() {
  const {
    articles: publishedArticles,
    errata,
    lectureNotes,
    authors: allAuthors,
  } = await getPublishedData();

  const authorMap = new Map(allAuthors.map((a) => [a.id, a]));

  const errataByParent = new Map<string, (typeof errata)[number][]>();
  for (const e of errata) {
    if (e.parentId) {
      const existing = errataByParent.get(e.parentId);
      if (existing) {
        existing.push(e);
      } else {
        errataByParent.set(e.parentId, [e]);
      }
    }
  }

  const preprints = publishedArticles.filter((a) => a.type === "preprint");
  const published = publishedArticles.filter((a) => a.type === "published");

  return (
    <>
      <HeroSection />

      {preprints.length > 0 && (
        <section id="preprints" className="mt-16">
          <h2 className="text-2xl font-semibold text-stone-900">Preprints</h2>
          <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
          <ArticleList
            articles={preprints}
            authorMap={authorMap}
            errataByParent={errataByParent}
          />
        </section>
      )}

      <section id="publications" className="mt-16">
        <h2 className="text-2xl font-semibold text-stone-900">Publications</h2>
        <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
        <ArticleList
          articles={published}
          authorMap={authorMap}
          errataByParent={errataByParent}
        />
      </section>

      {lectureNotes.length > 0 && (
        <section id="lecture-notes" className="mt-16">
          <h2 className="text-2xl font-semibold text-stone-900">
            Lecture Notes
          </h2>
          <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
          <ArticleList
            articles={lectureNotes}
            authorMap={authorMap}
            errataByParent={errataByParent}
          />
        </section>
      )}
    </>
  );
}
