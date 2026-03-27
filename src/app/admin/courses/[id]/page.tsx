import { notFound } from "next/navigation";
import { getCourse } from "@/lib/actions/courses";
import CourseForm from "@/components/admin/course-form";

interface CourseEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseEditPage({ params }: CourseEditPageProps) {
  const { id } = await params;

  const course = await getCourse(id);
  if (!course) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Edit Course</h1>
      <div className="max-w-xl rounded-lg border border-stone-200 bg-white shadow-sm p-6">
        <CourseForm course={course} />
      </div>
    </div>
  );
}
