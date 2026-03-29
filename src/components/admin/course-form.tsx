"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse, updateCourse } from "@/lib/actions/courses";
import ConfirmDialog from "@/components/admin/confirm-dialog";

type Course = {
  id: string;
  courseNumber: string;
  courseTitle: string;
  semester: string;
  year: number;
  institution: string;
  status: string;
};

interface CourseFormProps {
  course?: Course;
}

export default function CourseForm({ course }: CourseFormProps) {
  const router = useRouter();
  const isEdit = !!course;

  const [courseNumber, setCourseNumber] = useState(course?.courseNumber ?? "");
  const [courseTitle, setCourseTitle] = useState(course?.courseTitle ?? "");
  const [semester, setSemester] = useState(course?.semester ?? "Fall");
  const [year, setYear] = useState<number>(course?.year ?? new Date().getFullYear());
  const [institution, setInstitution] = useState(course?.institution ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const inputClass =
    "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-150";

  function buildPayload(status: "draft" | "published") {
    return { courseNumber, courseTitle, semester, year, institution, status };
  }

  async function handleSave(status: "draft" | "published") {
    setSaving(true);
    setError(null);

    const payload = buildPayload(status);

    const result = isEdit
      ? await updateCourse(course.id, payload)
      : await createCourse(payload);

    if (result.success) {
      router.push("/admin/courses");
      router.refresh();
    } else {
      setError(result.error);
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleSave("draft");
  }

  async function handlePublishConfirm() {
    setShowPublishConfirm(false);
    await handleSave("published");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Course Number */}
        <div>
          <label
            htmlFor="course-number"
            className="block text-sm font-medium text-stone-700 mb-1"
          >
            Course Number <span className="text-red-500">*</span>
          </label>
          <input
            id="course-number"
            type="text"
            value={courseNumber}
            onChange={(e) => setCourseNumber(e.target.value)}
            required
            placeholder="e.g. MATH 101"
            className={inputClass}
          />
        </div>

        {/* Course Title */}
        <div>
          <label
            htmlFor="course-title"
            className="block text-sm font-medium text-stone-700 mb-1"
          >
            Course Title <span className="text-red-500">*</span>
          </label>
          <input
            id="course-title"
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            required
            placeholder="e.g. Calculus I"
            className={inputClass}
          />
        </div>

        {/* Semester */}
        <div>
          <label
            htmlFor="course-semester"
            className="block text-sm font-medium text-stone-700 mb-1"
          >
            Semester <span className="text-red-500">*</span>
          </label>
          <select
            id="course-semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
            className={inputClass}
          >
            <option value="Fall">Fall</option>
            <option value="Spring">Spring</option>
            <option value="Summer">Summer</option>
          </select>
        </div>

        {/* Year */}
        <div>
          <label
            htmlFor="course-year"
            className="block text-sm font-medium text-stone-700 mb-1"
          >
            Year <span className="text-red-500">*</span>
          </label>
          <input
            id="course-year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            required
            min={1900}
            max={2100}
            className={inputClass}
          />
        </div>

        {/* Institution */}
        <div>
          <label
            htmlFor="course-institution"
            className="block text-sm font-medium text-stone-700 mb-1"
          >
            Institution <span className="text-red-500">*</span>
          </label>
          <input
            id="course-institution"
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
            placeholder="e.g. MIT"
            className={inputClass}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {course?.status !== "published" && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-stone-700 border border-stone-300 shadow-sm hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => course?.status === "published" ? handlePublishConfirm() : setShowPublishConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : course?.status === "published" ? "Save" : "Publish"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/courses")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-stone-700 border border-stone-300 shadow-sm hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150"
          >
            Cancel
          </button>
        </div>
      </form>

      {showPublishConfirm && (
        <ConfirmDialog
          title="Publish Course"
          message={`Are you sure you want to publish "${courseNumber}: ${courseTitle}"? It will be visible on the public site.`}
          confirmLabel={saving ? "Publishing\u2026" : "Publish"}
          variant="default"
          onConfirm={handlePublishConfirm}
          onCancel={() => setShowPublishConfirm(false)}
        />
      )}
    </>
  );
}
