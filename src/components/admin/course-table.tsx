"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  softDeleteCourse,
  restoreCourse,
  toggleCourseStatus,
} from "@/lib/actions/courses";
import ConfirmDialog from "@/components/admin/confirm-dialog";

type Course = {
  id: string;
  courseNumber: string;
  courseTitle: string;
  semester: string;
  year: number;
  institution: string;
  status: string;
  deletedAt: Date | null;
};

interface CourseTableProps {
  courses: Course[];
  isTrash: boolean;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      Draft
    </span>
  );
}

export default function CourseTable({ courses, isTrash }: CourseTableProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "publish" | "restore";
    course: Course;
  } | null>(null);

  async function handleConfirm() {
    if (!confirmAction || busy) return;
    setBusy(true);
    setError(null);

    let result;
    switch (confirmAction.type) {
      case "delete":
        result = await softDeleteCourse(confirmAction.course.id);
        break;
      case "publish":
        result = await toggleCourseStatus(confirmAction.course.id);
        break;
      case "restore":
        result = await restoreCourse(confirmAction.course.id);
        break;
    }

    if (result.success) {
      setConfirmAction(null);
      router.refresh();
    } else {
      setError(result.error);
      setConfirmAction(null);
    }
    setBusy(false);
  }

  function handleToggleStatus(course: Course) {
    if (course.status === "draft") {
      setConfirmAction({ type: "publish", course });
    } else {
      (async () => {
        setBusy(true);
        setError(null);
        const result = await toggleCourseStatus(course.id);
        if (result.success) {
          router.refresh();
        } else {
          setError(result.error);
        }
        setBusy(false);
      })();
    }
  }

  function handleDelete(course: Course) {
    setConfirmAction({ type: "delete", course });
  }

  function handleRestore(course: Course) {
    setConfirmAction({ type: "restore", course });
  }

  function confirmDialogProps() {
    if (!confirmAction) return null;
    const label = `${confirmAction.course.courseNumber}: ${confirmAction.course.courseTitle}`;
    switch (confirmAction.type) {
      case "delete":
        return {
          title: "Delete Course",
          message: `Are you sure you want to delete "${label}"? It will be moved to the trash.`,
          confirmLabel: busy ? "Deleting\u2026" : "Delete",
          variant: "danger" as const,
        };
      case "publish":
        return {
          title: "Publish Course",
          message: `Are you sure you want to publish "${label}"? It will be visible on the public site.`,
          confirmLabel: busy ? "Publishing\u2026" : "Publish",
          variant: "default" as const,
        };
      case "restore":
        return {
          title: "Restore Course",
          message: `Restore "${label}" from the trash?`,
          confirmLabel: busy ? "Restoring\u2026" : "Restore",
          variant: "default" as const,
        };
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Course Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Semester &amp; Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Institution
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-stone-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-stone-400"
                >
                  {isTrash ? "Trash is empty." : "No courses yet."}
                </td>
              </tr>
            )}
            {courses.map((course) => (
              <tr
                key={course.id}
                className="border-b border-stone-100 hover:bg-stone-50 transition-colors duration-100 last:border-0"
              >
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    {course.courseNumber}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  {course.courseTitle}
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  {course.semester} {course.year}
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  {course.institution}
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  <StatusBadge status={course.status} />
                </td>
                <td className="px-4 py-3.5 text-sm text-right">
                  {isTrash ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(course)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-stone-700 border border-stone-300 hover:bg-stone-50 transition-colors duration-150"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(course)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-stone-700 border border-stone-300 hover:bg-stone-50 transition-colors duration-150 disabled:opacity-50"
                      >
                        {course.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(course)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors duration-150 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmAction && confirmDialogProps() && (
        <ConfirmDialog
          {...confirmDialogProps()!}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}
