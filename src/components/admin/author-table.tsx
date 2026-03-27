"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteAuthor } from "@/lib/actions/authors";
import ConfirmDialog from "@/components/admin/confirm-dialog";

type Author = {
  id: string;
  name: string;
  openAlexId: string | null;
  orcid: string | null;
  affiliation: string | null;
  homepage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface AuthorTableProps {
  authors: Author[];
  articleCounts: Record<string, number>;
}

export default function AuthorTable({
  authors,
  articleCounts,
}: AuthorTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);

    const result = await deleteAuthor(deleteTarget.id);

    if (result.success) {
      setDeleteTarget(null);
      router.refresh();
    } else {
      setError(result.error);
      setDeleteTarget(null);
    }
    setDeleting(false);
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
                Affiliation
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Articles
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-stone-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {authors.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-stone-400"
                >
                  No authors yet.
                </td>
              </tr>
            )}
            {authors.map((author) => (
              <tr
                key={author.id}
                className="border-b border-stone-100 hover:bg-stone-50 transition-colors duration-100 last:border-0"
              >
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  <Link
                    href={`/admin/authors/${author.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    {author.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  {author.affiliation || (
                    <span className="text-stone-300">&mdash;</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  {articleCounts[author.id] ?? 0}
                </td>
                <td className="px-4 py-3.5 text-sm text-right">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(author)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 transition-colors duration-150"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Author"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
