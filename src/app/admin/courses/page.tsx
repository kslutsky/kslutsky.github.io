import Link from "next/link";
import { getCourses } from "@/lib/actions/courses";
import CourseTable from "@/components/admin/course-table";

interface CoursesPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const isTrash = params.tab === "trash";

  const courseList = await getCourses(isTrash);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Courses</h1>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150"
        >
          New Course
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-6 border-b border-stone-200 mb-6">
        <Link
          href="/admin/courses"
          className={
            !isTrash
              ? "pb-2 text-sm border-b-2 border-indigo-500 text-stone-900 font-medium"
              : "pb-2 text-sm text-stone-500 hover:text-stone-700"
          }
        >
          Active
        </Link>
        <Link
          href="/admin/courses?tab=trash"
          className={
            isTrash
              ? "pb-2 text-sm border-b-2 border-indigo-500 text-stone-900 font-medium"
              : "pb-2 text-sm text-stone-500 hover:text-stone-700"
          }
        >
          Trash
        </Link>
      </div>

      <CourseTable courses={courseList} isTrash={isTrash} />
    </div>
  );
}
