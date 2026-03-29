import { unstable_cache } from "next/cache";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, authors } from "@/lib/db/schema";
import { ArticleList } from "@/components/public/article-list";
import Link from "next/link";

const getPublicationsData = unstable_cache(
  async () => {
    const published = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.type, "published"),
          eq(articles.status, "published"),
          isNull(articles.deletedAt)
        )
      )
      .orderBy(
        sql`${articles.publishedYear} DESC NULLS LAST`,
        sql`${articles.publishedMonth} DESC NULLS LAST`,
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

    const allAuthors = await db.select().from(authors);

    return { articles: published, errata: allErrata, authors: allAuthors };
  },
  ["all-publications"],
  { tags: ["articles"] }
);

export default async function PublicationsPage() {
  const { articles: published, errata, authors: allAuthors } =
    await getPublicationsData();

  const authorMap = new Map(allAuthors.map((a) => [a.id, a]));

  const errataByParent = new Map<string, (typeof errata)[number][]>();
  for (const e of errata) {
    if (e.parentId) {
      const existing = errataByParent.get(e.parentId);
      if (existing) existing.push(e);
      else errataByParent.set(e.parentId, [e]);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm font-medium text-stone-400 hover:text-indigo-600 transition-colors"
        >
          &larr; Back to homepage
        </Link>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-2">
        All Publications
      </h1>
      <div className="h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-transparent mb-10" />
      <ArticleList
        articles={published}
        authorMap={authorMap}
        errataByParent={errataByParent}
      />
    </div>
  );
}
