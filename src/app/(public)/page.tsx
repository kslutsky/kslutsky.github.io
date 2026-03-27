import { unstable_cache } from "next/cache";
import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, authors } from "@/lib/db/schema";
import { HeroSection } from "@/components/public/hero-section";
import { ArticleList } from "@/components/public/article-list";

const linkClassName =
  "text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded-sm";

const getPublishedData = unstable_cache(
  async () => {
    const allArticles = await db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.status, "published"),
          isNull(articles.deletedAt),
          sql`${articles.type} != 'erratum'`
        )
      )
      .orderBy(
        sql`${articles.publishedYear} DESC NULLS LAST`,
        sql`${articles.publishedMonth} DESC NULLS LAST`,
        sql`${articles.publishedDay} DESC NULLS LAST`,
        sql`${articles.createdAt} DESC`
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

    return {
      articles: allArticles,
      errata: allErrata,
      authors: allAuthors,
    };
  },
  ["published-articles"],
  { tags: ["articles"] }
);

const lectureNotes = [
  {
    title: "Topological Full Groups",
    href: "/lecture-notes/Topological-full-groups.pdf",
  },
  {
    title: "Countable Borel Equivalence Relations",
    href: "/lecture-notes/cber.pdf",
  },
];

export default async function HomePage() {
  const { articles: publishedArticles, errata, authors: allAuthors } =
    await getPublishedData();

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

  return (
    <>
      <HeroSection />

      <section id="publications" className="mt-16">
        <h2 className="text-2xl font-semibold text-stone-900">Publications</h2>
        <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
        <ArticleList
          articles={publishedArticles}
          authorMap={authorMap}
          errataByParent={errataByParent}
        />
      </section>

      <section id="lecture-notes" className="mt-16">
        <h2 className="text-2xl font-semibold text-stone-900">
          Lecture Notes
        </h2>
        <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
        <ul className="mt-6 flex flex-col gap-3">
          {lectureNotes.map((note) => (
            <li key={note.href}>
              <a
                href={note.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                {note.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
