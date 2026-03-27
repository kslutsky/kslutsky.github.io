"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  softDeleteMentee,
  restoreMentee,
  toggleMenteeStatus,
} from "@/lib/actions/mentees";
import ConfirmDialog from "@/components/admin/confirm-dialog";

type Mentee = {
  id: string;
  name: string;
  category: string;
  institution: string;
  startYear: number;
  endYear: number | null;
  thesisTitle: string | null;
  firstPosition: string | null;
  homepage: string | null;
  status: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface MenteeTableProps {
  mentees: Mentee[];
  isTrash: boolean;
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

function CategoryBadge({ category }: { category: string }) {
  switch (category) {
    case "phd":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          PhD
        </span>
      );
    case "postdoc":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
          Postdoc
        </span>
      );
    case "masters":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
          Master&apos;s
        </span>
      );
    case "undergraduate":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
          Undergraduate
        </span>
      );
    default:
      return null;
  }
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

function yearRange(startYear: number, endYear: number | null) {
  if (endYear) {
    return `${startYear}–${endYear}`;
  }
  return `${startYear}–present`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MenteeTable({ mentees, isTrash }: MenteeTableProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "publish" | "restore";
    mentee: Mentee;
  } | null>(null);

  async function handleConfirm() {
    if (!confirmAction || busy) return;
    setBusy(true);
    setError(null);

    let result;
    switch (confirmAction.type) {
      case "delete":
        result = await softDeleteMentee(confirmAction.mentee.id);
        break;
      case "publish":
        result = await toggleMenteeStatus(confirmAction.mentee.id);
        break;
      case "restore":
        result = await restoreMentee(confirmAction.mentee.id);
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

  function handleToggleStatus(mentee: Mentee) {
    if (mentee.status === "draft") {
      setConfirmAction({ type: "publish", mentee });
    } else {
      (async () => {
        setBusy(true);
        setError(null);
        const result = await toggleMenteeStatus(mentee.id);
        if (result.success) {
          router.refresh();
        } else {
          setError(result.error);
        }
        setBusy(false);
      })();
    }
  }

  function handleDelete(mentee: Mentee) {
    setConfirmAction({ type: "delete", mentee });
  }

  function handleRestore(mentee: Mentee) {
    setConfirmAction({ type: "restore", mentee });
  }

  function confirmDialogProps() {
    if (!confirmAction) return null;
    switch (confirmAction.type) {
      case "delete":
        return {
          title: "Delete Mentee",
          message: `Are you sure you want to delete "${confirmAction.mentee.name}"? It will be moved to the trash.`,
          confirmLabel: busy ? "Deleting\u2026" : "Delete",
          variant: "danger" as const,
        };
      case "publish":
        return {
          title: "Publish Mentee",
          message: `Are you sure you want to publish "${confirmAction.mentee.name}"? It will be visible on the public site.`,
          confirmLabel: busy ? "Publishing\u2026" : "Publish",
          variant: "default" as const,
        };
      case "restore":
        return {
          title: "Restore Mentee",
          message: `Restore "${confirmAction.mentee.name}" from the trash?`,
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
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Institution
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Years
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
            {mentees.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-stone-400"
                >
                  {isTrash ? "Trash is empty." : "No mentees yet."}
                </td>
              </tr>
            )}
            {mentees.map((mentee) => (
              <tr
                key={mentee.id}
                className="border-b border-stone-100 hover:bg-stone-50 transition-colors duration-100 last:border-0"
              >
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  <Link
                    href={`/admin/mentees/${mentee.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    {mentee.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  <CategoryBadge category={mentee.category} />
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  {mentee.institution}
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  {yearRange(mentee.startYear, mentee.endYear)}
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  <StatusBadge status={mentee.status} />
                </td>
                <td className="px-4 py-3.5 text-sm text-right">
                  {isTrash ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(mentee)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/mentees/${mentee.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-stone-700 border border-stone-300 hover:bg-stone-50 transition-colors duration-150"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(mentee)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-stone-700 border border-stone-300 hover:bg-stone-50 transition-colors duration-150 disabled:opacity-50"
                      >
                        {mentee.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(mentee)}
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
