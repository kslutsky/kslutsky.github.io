import { unstable_cache } from "next/cache";
import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { TeachingList } from "@/components/public/teaching-list";
import Link from "next/link";

const getAllCourses = unstable_cache(
  async () => {
    return db
      .select()
      .from(courses)
      .where(and(eq(courses.status, "published"), isNull(courses.deletedAt)))
      .orderBy(
        courses.institution,
        sql`${courses.year} DESC`,
        sql`CASE ${courses.semester} WHEN 'Fall' THEN 1 WHEN 'Summer' THEN 2 WHEN 'Spring' THEN 3 END ASC`
      );
  },
  ["all-courses"],
  { tags: ["academic"], revalidate: 3600 }
);

export default async function TeachingPage() {
  const allCourses = await getAllCourses();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          &larr; Back to homepage
        </Link>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
        Full Teaching Record
      </h1>
      <div className="h-1 w-16 rounded-full mb-10" style={{ background: `linear-gradient(90deg, var(--gradient-accent), transparent)` }} />
      <TeachingList courses={allCourses} />
    </div>
  );
}
