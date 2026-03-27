import CourseForm from "@/components/admin/course-form";

export default function NewCoursePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">New Course</h1>
      <div className="max-w-xl rounded-lg border border-stone-200 bg-white shadow-sm p-6">
        <CourseForm />
      </div>
    </div>
  );
}
