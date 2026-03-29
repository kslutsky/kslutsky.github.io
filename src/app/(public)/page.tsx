import { unstable_cache } from "next/cache";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { articles, authors, courses, mentees } from "@/lib/db/schema";
import { HeroSection } from "@/components/public/hero-section";
import { CareerTimeline } from "@/components/public/career-timeline";
import { ScrollToEnd } from "@/components/public/scroll-to-end";
import { ArticleList } from "@/components/public/article-list";
import { TeachingList } from "@/components/public/teaching-list";
import { MenteeList } from "@/components/public/mentee-list";
import Link from "next/link";

// How many years of teaching to show on homepage
const RECENT_TEACHING_YEARS = 3;

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

const getAcademicData = unstable_cache(
  async () => {
    const publishedCourses = await db
      .select()
      .from(courses)
      .where(and(eq(courses.status, "published"), isNull(courses.deletedAt)))
      .orderBy(
        courses.institution,
        sql`${courses.year} DESC`,
        sql`CASE ${courses.semester} WHEN 'Fall' THEN 1 WHEN 'Summer' THEN 2 WHEN 'Spring' THEN 3 END ASC`
      );

    const publishedMentees = await db
      .select()
      .from(mentees)
      .where(and(eq(mentees.status, "published"), isNull(mentees.deletedAt)))
      .orderBy(
        sql`CASE ${mentees.category} WHEN 'phd' THEN 1 WHEN 'postdoc' THEN 2 WHEN 'masters' THEN 3 WHEN 'undergraduate' THEN 4 END ASC`,
        sql`${mentees.endYear} IS NOT NULL`,
        sql`${mentees.endYear} DESC`,
        sql`${mentees.startYear} DESC`
      );

    return { courses: publishedCourses, mentees: publishedMentees };
  },
  ["academic-data"],
  { tags: ["academic"] }
);

const viewAllClass =
  "text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-150 whitespace-nowrap inline-flex items-center gap-1 group";

function SectionHeading({
  children,
  viewAllHref,
  viewAllLabel,
}: {
  children: React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {children}
        </h2>
        <div className="mt-2 h-1 w-16 rounded-full" style={{ background: `linear-gradient(90deg, var(--gradient-accent), transparent)` }} />
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className={viewAllClass}>
          {viewAllLabel ?? "View all"}{" "}
          <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const {
    articles: publishedArticles,
    errata,
    lectureNotes,
    authors: allAuthors,
  } = await getPublishedData();
  const { courses: publishedCourses, mentees: publishedMentees } =
    await getAcademicData();

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
  const selectedPublications = published.filter((a) => a.featured === 1);
  const currentYear = new Date().getFullYear();
  const recentCourses = publishedCourses.filter(
    (c) => c.year >= currentYear - RECENT_TEACHING_YEARS
  );

  return (
    <>
      {/* Hero — full viewport with Voronoi animation */}
      <HeroSection />

      {/* Career Timeline */}
      <section className="bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <ScrollToEnd>
            <CareerTimeline />
          </ScrollToEnd>
        </div>
      </section>

      {/* Preprints */}
      {preprints.length > 0 && (
        <section id="preprints" className="bg-[var(--bg-secondary)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <SectionHeading>Preprints</SectionHeading>
            <ArticleList
              articles={preprints}
              authorMap={authorMap}
              errataByParent={errataByParent}
            />
          </div>
        </section>
      )}

      {/* Selected Publications */}
      <section id="publications" className="bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <SectionHeading
            viewAllHref="/publications"
            viewAllLabel="View all publications"
          >
            Selected Publications
          </SectionHeading>
          {selectedPublications.length > 0 ? (
            <ArticleList
              articles={selectedPublications}
              authorMap={authorMap}
              errataByParent={errataByParent}
            />
          ) : (
            <ArticleList
              articles={published}
              authorMap={authorMap}
              errataByParent={errataByParent}
            />
          )}
        </div>
      </section>

      {/* Lecture Notes */}
      {lectureNotes.length > 0 && (
        <section id="lecture-notes" className="bg-[var(--bg-secondary)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <SectionHeading>Notes</SectionHeading>
            <ArticleList
              articles={lectureNotes}
              authorMap={authorMap}
              errataByParent={errataByParent}
            />
          </div>
        </section>
      )}

      {/* Students */}
      <section id="students" className="bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <SectionHeading>Mentees</SectionHeading>
          <MenteeList mentees={publishedMentees} />
        </div>
      </section>

      {/* Recent Teaching */}
      <section id="teaching" className="bg-[var(--bg-secondary)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <SectionHeading
            viewAllHref="/teaching"
            viewAllLabel="View full teaching record"
          >
            Recent Teaching
          </SectionHeading>
          <TeachingList courses={recentCourses} />
        </div>
      </section>
    </>
  );
}
