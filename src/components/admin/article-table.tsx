"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  softDeleteArticle,
  restoreArticle,
  toggleArticleStatus,
} from "@/lib/actions/articles";
import ConfirmDialog from "@/components/admin/confirm-dialog";

type Article = {
  id: string;
  type: string;
  parentId: string | null;
  title: string;
  publishedYear: number | null;
  status: string;
  deletedAt: Date | null;
};

type Author = {
  id: string;
  name: string;
};

interface ArticleTableProps {
  articles: Article[];
  authors: Author[];
  isTrash: boolean;
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

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

function TypeBadge({ type }: { type: string }) {
  switch (type) {
    case "preprint":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
          Preprint
        </span>
      );
    case "published":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
          Published
        </span>
      );
    case "erratum":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          Erratum
        </span>
      );
    case "notes":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
          Notes
        </span>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Kebab dropdown for mobile card layout
// ---------------------------------------------------------------------------

function KebabMenu({
  article,
  onDelete,
  onToggleStatus,
}: {
  article: Article;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-100"
        aria-label="Actions"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-stone-200 bg-white shadow-lg z-20 py-1">
          <Link
            href={`/admin/articles/${article.id}`}
            className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            onClick={() => setOpen(false)}
          >
            Edit
          </Link>
          {article.type !== "erratum" && (
            <Link
              href={`/admin/articles/new?parentId=${article.id}`}
              className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
              onClick={() => setOpen(false)}
            >
              Add Erratum
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onToggleStatus();
            }}
            className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
          >
            {article.status === "published" ? "Unpublish" : "Publish"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function TrashKebabMenu({
  onRestore,
}: {
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors duration-100"
        aria-label="Actions"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-stone-200 bg-white shadow-lg z-20 py-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRestore();
            }}
            className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
          >
            Restore
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ArticleTable({
  articles,
  authors,
  isTrash,
}: ArticleTableProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "publish" | "restore";
    article: Article;
  } | null>(null);

  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  function truncate(text: string, maxLen: number) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "\u2026";
  }

  async function handleConfirm() {
    if (!confirmAction || busy) return;
    setBusy(true);
    setError(null);

    let result;
    switch (confirmAction.type) {
      case "delete":
        result = await softDeleteArticle(confirmAction.article.id);
        break;
      case "publish":
        result = await toggleArticleStatus(confirmAction.article.id);
        break;
      case "restore":
        result = await restoreArticle(confirmAction.article.id);
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

  function handleToggleStatus(article: Article) {
    if (article.status === "draft") {
      // Publishing requires confirmation
      setConfirmAction({ type: "publish", article });
    } else {
      // Unpublishing can be done directly
      (async () => {
        setBusy(true);
        setError(null);
        const result = await toggleArticleStatus(article.id);
        if (result.success) {
          router.refresh();
        } else {
          setError(result.error);
        }
        setBusy(false);
      })();
    }
  }

  function handleDelete(article: Article) {
    setConfirmAction({ type: "delete", article });
  }

  function handleRestore(article: Article) {
    setConfirmAction({ type: "restore", article });
  }

  // -------------------------------------------------------------------------
  // Confirm dialog props
  // -------------------------------------------------------------------------

  function confirmDialogProps() {
    if (!confirmAction) return null;
    switch (confirmAction.type) {
      case "delete":
        return {
          title: "Delete Article",
          message: `Are you sure you want to delete "${truncate(confirmAction.article.title, 60)}"? It will be moved to the trash.`,
          confirmLabel: busy ? "Deleting\u2026" : "Delete",
          variant: "danger" as const,
        };
      case "publish":
        return {
          title: "Publish Article",
          message: `Are you sure you want to publish "${truncate(confirmAction.article.title, 60)}"? It will be visible on the public site.`,
          confirmLabel: busy ? "Publishing\u2026" : "Publish",
          variant: "default" as const,
        };
      case "restore":
        return {
          title: "Restore Article",
          message: `Restore "${truncate(confirmAction.article.title, 60)}" from the trash?`,
          confirmLabel: busy ? "Restoring\u2026" : "Restore",
          variant: "default" as const,
        };
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ---- Desktop table (hidden below 1024px) ---- */}
      <div className="hidden lg:block w-full overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-stone-400">
                Year
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-stone-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-stone-400"
                >
                  {isTrash ? "Trash is empty." : "No articles yet."}
                </td>
              </tr>
            )}
            {articles.map((article) => (
              <tr
                key={article.id}
                className="border-b border-stone-100 hover:bg-stone-50 transition-colors duration-100 last:border-0"
              >
                <td className="px-4 py-3.5 text-sm text-stone-700 max-w-xs">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                    title={article.title}
                  >
                    {truncate(article.title, 60)}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  <TypeBadge type={article.type} />
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  <StatusBadge status={article.status} />
                </td>
                <td className="px-4 py-3.5 text-sm text-stone-700">
                  {article.publishedYear ?? (
                    <span className="text-stone-300">&mdash;</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-sm text-right">
                  {isTrash ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(article)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50"
                    >
                      Restore
                    </button>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-stone-700 border border-stone-300 hover:bg-stone-50 transition-colors duration-150"
                      >
                        Edit
                      </Link>
                      {article.type !== "erratum" && (
                        <Link
                          href={`/admin/articles/new?parentId=${article.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-stone-700 border border-stone-300 hover:bg-stone-50 transition-colors duration-150"
                        >
                          Add Erratum
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(article)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-stone-700 border border-stone-300 hover:bg-stone-50 transition-colors duration-150 disabled:opacity-50"
                      >
                        {article.status === "published"
                          ? "Unpublish"
                          : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(article)}
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

      {/* ---- Mobile card layout (visible below 1024px) ---- */}
      <div className="lg:hidden space-y-3">
        {articles.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white shadow-sm px-4 py-8 text-center text-sm text-stone-400">
            {isTrash ? "Trash is empty." : "No articles yet."}
          </div>
        )}
        {articles.map((article) => (
          <div
            key={article.id}
            className="rounded-lg border border-stone-200 bg-white shadow-sm px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/articles/${article.id}`}
                  className="font-medium text-sm text-indigo-600 hover:text-indigo-700 hover:underline line-clamp-2"
                >
                  {article.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <TypeBadge type={article.type} />
                  <StatusBadge status={article.status} />
                  {article.publishedYear && (
                    <span className="text-xs text-stone-400">
                      {article.publishedYear}
                    </span>
                  )}
                </div>
              </div>
              {isTrash ? (
                <TrashKebabMenu onRestore={() => handleRestore(article)} />
              ) : (
                <KebabMenu
                  article={article}
                  onDelete={() => handleDelete(article)}
                  onToggleStatus={() => handleToggleStatus(article)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---- Confirm Dialog ---- */}
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
