"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createArticle, updateArticle } from "@/lib/actions/articles";
import { createAuthor } from "@/lib/actions/authors";
import { fetchArxiv, fetchDoi, matchAuthors } from "@/lib/actions/fetch-metadata";
import type { MatchResult } from "@/lib/actions/fetch-metadata";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import AuthorMatcher from "@/components/admin/author-matcher";
import PdfUpload from "@/components/admin/pdf-upload";
import type { ArticleType, PdfSource } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

type Article = {
  id: string;
  type: string;
  parentId: string | null;
  arxivId: string | null;
  arxivVersion: number | null;
  doi: string | null;
  title: string;
  abstract: string | null;
  pdfUrl: string | null;
  pdfSource: string | null;
  journalName: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  publishedYear: number | null;
  publishedMonth: number | null;
  publishedDay: number | null;
  authorIds: string[];
  tagIds: string[];
  status: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface ArticleFormProps {
  article?: Article;
  authors: Author[];
  parent?: Article | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArticleForm({ article, authors, parent }: ArticleFormProps) {
  const router = useRouter();
  const isEdit = !!article;
  const isErratum = !!parent;
  const isLectureNotes = article?.type === "lecture_notes" || false;

  // Fetch fields
  const [arxivIdInput, setArxivIdInput] = useState(article?.arxivId ?? "");
  const [doiInput, setDoiInput] = useState(article?.doi ?? "");
  const [hasFetched, setHasFetched] = useState(false);
  const [fetching, setFetching] = useState<"arxiv" | "doi" | null>(null);

  // Form fields
  const [title, setTitle] = useState(
    article?.title ?? (isErratum ? `Erratum to "${parent!.title}"` : "")
  );
  const [abstract, setAbstract] = useState(article?.abstract ?? "");
  const [type, setType] = useState<ArticleType>(
    isErratum ? "erratum" : (article?.type as ArticleType) ?? "preprint"
  );
  const [publishedYear, setPublishedYear] = useState(
    article?.publishedYear?.toString() ?? ""
  );
  const [publishedMonth, setPublishedMonth] = useState(
    article?.publishedMonth?.toString() ?? ""
  );
  const [publishedDay, setPublishedDay] = useState(
    article?.publishedDay?.toString() ?? ""
  );
  const [journalName, setJournalName] = useState(article?.journalName ?? "");
  const [volume, setVolume] = useState(article?.volume ?? "");
  const [issue, setIssue] = useState(article?.issue ?? "");
  const [pages, setPages] = useState(article?.pages ?? "");

  // arXiv-specific
  const [arxivVersion, setArxivVersion] = useState<number | undefined>(
    article?.arxivVersion ?? undefined
  );

  // Authors — pre-populate from parent in erratum mode
  const [authorIds, setAuthorIds] = useState<string[]>(
    article?.authorIds ?? (isErratum ? parent!.authorIds : [])
  );
  const [authorSearch, setAuthorSearch] = useState("");
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);

  // Author matcher state
  const [fetchedAuthors, setFetchedAuthors] = useState<
    { name: string; orcid?: string }[]
  >([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [showMatcher, setShowMatcher] = useState(false);

  // PDF — default to "upload" in erratum and lecture notes mode
  const [pdfSource, setPdfSource] = useState<PdfSource>(
    (article?.pdfSource as PdfSource) ?? (isErratum || type === "lecture_notes" ? "upload" : "arxiv")
  );
  const [pdfUrl, setPdfUrl] = useState(article?.pdfUrl ?? "");

  // Featured
  const [featured, setFeatured] = useState(article?.featured === 1);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showJournalFields, setShowJournalFields] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch handlers
  // ---------------------------------------------------------------------------

  const handleFetchArxiv = useCallback(async () => {
    if (!arxivIdInput.trim()) return;
    setFetching("arxiv");
    setError(null);

    const result = await fetchArxiv(arxivIdInput.trim());

    if (result.success) {
      const data = result.data;
      setTitle(data.title);
      setAbstract(data.abstract);
      setType("preprint");
      setPublishedYear(data.publishedYear.toString());
      setPublishedMonth(data.publishedMonth.toString());
      setPublishedDay(data.publishedDay.toString());
      setPdfUrl(data.pdfUrl);
      setPdfSource("arxiv");
      setArxivVersion(data.arxivVersion);
      setArxivIdInput(data.arxivId);
      setHasFetched(true);

      // Match authors
      const authorNames = data.authors;
      const orcids = authorNames.map(() => undefined);
      const matchRes = await matchAuthors(authorNames, orcids);
      if (matchRes.success) {
        setFetchedAuthors(
          authorNames.map((name) => ({ name }))
        );
        setMatchResult(matchRes.data);
        setShowMatcher(true);
      }
    } else {
      setError(result.error);
    }

    setFetching(null);
  }, [arxivIdInput]);

  const handleFetchDoi = useCallback(async () => {
    if (!doiInput.trim()) return;
    setFetching("doi");
    setError(null);

    const result = await fetchDoi(doiInput.trim());

    if (result.success) {
      const data = result.data;
      setTitle(data.title);
      setAbstract(data.abstract);
      setType("published");
      setDoiInput(data.doi);
      setJournalName(data.journalName);
      if (data.volume) setVolume(data.volume);
      if (data.issue) setIssue(data.issue);
      if (data.pages) setPages(data.pages);
      if (data.publishedYear) setPublishedYear(data.publishedYear.toString());
      if (data.publishedMonth)
        setPublishedMonth(data.publishedMonth.toString());
      if (data.publishedDay) setPublishedDay(data.publishedDay.toString());
      setHasFetched(true);

      // Match authors (CrossRef provides orcids)
      const authorNames = data.authors.map((a) => a.name);
      const orcids = data.authors.map((a) => a.orcid);
      const matchRes = await matchAuthors(authorNames, orcids);
      if (matchRes.success) {
        setFetchedAuthors(
          data.authors.map((a) => ({ name: a.name, orcid: a.orcid }))
        );
        setMatchResult(matchRes.data);
        setShowMatcher(true);
      }
    } else {
      setError(result.error);
    }

    setFetching(null);
  }, [doiInput]);

  // ---------------------------------------------------------------------------
  // Author matcher confirm
  // ---------------------------------------------------------------------------

  async function handleAuthorMatchConfirm(resolvedIds: string[]) {
    setError(null);
    const finalIds: string[] = [];

    for (let i = 0; i < resolvedIds.length; i++) {
      if (resolvedIds[i] === "") {
        // Create new author
        const res = await createAuthor({ name: fetchedAuthors[i].name });
        if (res.success) {
          finalIds.push(res.data.id);
        } else {
          setError(`Failed to create author "${fetchedAuthors[i].name}": ${res.error}`);
          return;
        }
      } else {
        finalIds.push(resolvedIds[i]);
      }
    }

    setAuthorIds(finalIds);
    setShowMatcher(false);
    setMatchResult(null);
    setFetchedAuthors([]);
  }

  function handleAuthorMatchCancel() {
    setShowMatcher(false);
    setMatchResult(null);
    setFetchedAuthors([]);
  }

  // ---------------------------------------------------------------------------
  // Author tag management
  // ---------------------------------------------------------------------------

  function addAuthor(authorId: string) {
    if (!authorIds.includes(authorId)) {
      setAuthorIds((prev) => [...prev, authorId]);
    }
    setAuthorSearch("");
    setShowAuthorDropdown(false);
  }

  function removeAuthor(authorId: string) {
    setAuthorIds((prev) => prev.filter((id) => id !== authorId));
  }

  const filteredAuthors = authors.filter(
    (a) =>
      !authorIds.includes(a.id) &&
      a.name.toLowerCase().includes(authorSearch.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(status: "draft" | "published") {
    setSaving(true);
    setError(null);

    const payload = {
      type: isErratum ? ("erratum" as const) : type,
      parentId: isErratum ? parent!.id : undefined,
      arxivId: arxivIdInput.trim() || undefined,
      arxivVersion: arxivVersion,
      doi: doiInput.trim() || undefined,
      title,
      abstract: abstract || undefined,
      pdfUrl: pdfUrl || undefined,
      pdfSource: pdfUrl ? pdfSource : undefined,
      journalName: journalName || undefined,
      volume: volume || undefined,
      issue: issue || undefined,
      pages: pages || undefined,
      publishedYear: publishedYear ? parseInt(publishedYear, 10) : undefined,
      publishedMonth: publishedMonth
        ? parseInt(publishedMonth, 10)
        : undefined,
      publishedDay: publishedDay ? parseInt(publishedDay, 10) : undefined,
      authorIds,
      tagIds: article?.tagIds ?? [],
      featured: featured ? 1 : 0,
      status,
    };

    const result = isEdit
      ? await updateArticle(article.id, payload)
      : await createArticle(payload);

    if (result.success) {
      router.push("/admin/articles");
      router.refresh();
    } else {
      setError(result.error);
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const inputClass =
    "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-150";

  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  // ---------------------------------------------------------------------------
  // Shared sub-sections
  // ---------------------------------------------------------------------------

  const pdfSection = (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
        PDF
      </h2>

      <div>
        <label className={labelClass}>PDF Source</label>
        <div className="flex gap-4">
          {(["arxiv", "upload", "external"] as const).map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="radio"
                name="pdf-source"
                value={s}
                checked={pdfSource === s}
                onChange={() => setPdfSource(s)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              {s === "arxiv"
                ? "arXiv link (auto)"
                : s === "upload"
                  ? "Upload"
                  : "External URL"}
            </label>
          ))}
        </div>
      </div>

      {pdfSource === "arxiv" && pdfUrl && (
        <div className="text-sm text-stone-600">
          <span className="font-medium">URL:</span>{" "}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
          >
            {pdfUrl}
          </a>
        </div>
      )}

      {pdfSource === "upload" && (
        <PdfUpload
          value={pdfUrl}
          onChange={(url) => setPdfUrl(url)}
        />
      )}

      {pdfSource === "external" && (
        <div>
          <label htmlFor="article-pdf-url" className={labelClass}>
            External PDF URL
          </label>
          <input
            id="article-pdf-url"
            type="url"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      )}
    </section>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Erratum context banner                                            */}
      {/* ----------------------------------------------------------------- */}
      {isErratum && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Creating an erratum for:{" "}
          <span className="font-medium">{parent!.title}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* PDF section (shown first in erratum and lecture notes mode)        */}
      {/* ----------------------------------------------------------------- */}
      {(isErratum || type === "lecture_notes") && (
        <>
          {pdfSection}
          <hr className="border-stone-200" />
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Fetch section (hidden in erratum and lecture notes mode)           */}
      {/* ----------------------------------------------------------------- */}
      {!isErratum && type !== "lecture_notes" && (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
              Fetch Metadata
            </h2>

            {/* arXiv fetch */}
            <div>
              <label className={labelClass}>arXiv ID</label>
              <div className="flex rounded-md shadow-sm overflow-hidden">
                <input
                  type="text"
                  value={arxivIdInput}
                  onChange={(e) => setArxivIdInput(e.target.value)}
                  placeholder="2301.12345 or https://arxiv.org/abs/..."
                  className="flex-1 rounded-none border-y border-l border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:ring-inset"
                />
                <button
                  type="button"
                  onClick={handleFetchArxiv}
                  disabled={fetching !== null || !arxivIdInput.trim()}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetching === "arxiv"
                    ? "Fetching..."
                    : hasFetched
                      ? (
                          <span className="text-amber-200">
                            Re-fetch (overwrites)
                          </span>
                        )
                      : "Fetch"}
                </button>
              </div>
            </div>

            {/* DOI fetch */}
            <div>
              <label className={labelClass}>DOI</label>
              <div className="flex rounded-md shadow-sm overflow-hidden">
                <input
                  type="text"
                  value={doiInput}
                  onChange={(e) => setDoiInput(e.target.value)}
                  placeholder="10.1234/..."
                  className="flex-1 rounded-none border-y border-l border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:ring-inset"
                />
                <button
                  type="button"
                  onClick={handleFetchDoi}
                  disabled={fetching !== null || !doiInput.trim()}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetching === "doi"
                    ? "Fetching..."
                    : hasFetched
                      ? (
                          <span className="text-amber-200">
                            Re-fetch (overwrites)
                          </span>
                        )
                      : "Fetch"}
                </button>
              </div>
            </div>
          </section>

          <hr className="border-stone-200" />
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Fields section                                                    */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
          Article Details
        </h2>

        {/* Title */}
        <div>
          <label htmlFor="article-title" className={labelClass}>
            Title <span className="text-red-500">*</span>
          </label>
          <textarea
            id="article-title"
            rows={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {/* Abstract */}
        <div>
          <label htmlFor="article-abstract" className={labelClass}>
            Abstract
          </label>
          <textarea
            id="article-abstract"
            rows={6}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Type (hidden in erratum mode) */}
        {!isErratum && (
          <div>
            <label className={labelClass}>Type</label>
            <div className="flex flex-wrap gap-4">
              {(["preprint", "published", "lecture_notes", "erratum"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="radio"
                    name="article-type"
                    value={t}
                    checked={type === t}
                    onChange={() => {
                      setType(t);
                      if (t === "lecture_notes") setPdfSource("upload");
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  {t === "lecture_notes" ? "Lecture Notes" : t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Published date */}
        <div>
          <label className={labelClass}>Published Date</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={publishedYear}
                onChange={(e) => setPublishedYear(e.target.value)}
                placeholder="Year"
                className={inputClass}
              />
            </div>
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={publishedMonth}
                onChange={(e) => setPublishedMonth(e.target.value)}
                placeholder="Month"
                className={inputClass}
              />
            </div>
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={publishedDay}
                onChange={(e) => setPublishedDay(e.target.value)}
                placeholder="Day"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Journal fields — hidden for lecture notes, collapsible for erratum, visible otherwise */}
        {type === "lecture_notes" ? null : isErratum ? (
          <div>
            <button
              type="button"
              onClick={() => setShowJournalFields((v) => !v)}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors duration-150"
            >
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${showJournalFields ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Optional — for published errata
            </button>

            <div
              className={`overflow-hidden transition-all duration-200 ${
                showJournalFields ? "max-h-96 mt-4" : "max-h-0"
              }`}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="article-doi" className={labelClass}>
                    DOI
                  </label>
                  <input
                    id="article-doi"
                    type="text"
                    value={doiInput}
                    onChange={(e) => setDoiInput(e.target.value)}
                    placeholder="10.1234/..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="article-journal" className={labelClass}>
                    Journal Name
                  </label>
                  <input
                    id="article-journal"
                    type="text"
                    value={journalName}
                    onChange={(e) => setJournalName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="article-volume" className={labelClass}>
                    Volume
                  </label>
                  <input
                    id="article-volume"
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="article-issue" className={labelClass}>
                    Issue
                  </label>
                  <input
                    id="article-issue"
                    type="text"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="article-pages" className={labelClass}>
                    Pages
                  </label>
                  <input
                    id="article-pages"
                    type="text"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="article-journal" className={labelClass}>
                Journal Name
              </label>
              <input
                id="article-journal"
                type="text"
                value={journalName}
                onChange={(e) => setJournalName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="article-volume" className={labelClass}>
                Volume
              </label>
              <input
                id="article-volume"
                type="text"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="article-issue" className={labelClass}>
                Issue
              </label>
              <input
                id="article-issue"
                type="text"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="article-pages" className={labelClass}>
                Pages
              </label>
              <input
                id="article-pages"
                type="text"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </section>

      <hr className="border-stone-200" />

      {/* ----------------------------------------------------------------- */}
      {/* Authors section                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
          Authors
        </h2>

        {/* Author matcher (shown after fetch) */}
        {showMatcher && matchResult && (
          <AuthorMatcher
            fetchedAuthors={fetchedAuthors}
            matchResult={matchResult}
            existingAuthors={authors}
            onConfirm={handleAuthorMatchConfirm}
            onCancel={handleAuthorMatchCancel}
          />
        )}

        {/* Selected authors as tags */}
        {authorIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {authorIds.map((id) => {
              const author = authors.find((a) => a.id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-sm text-indigo-700"
                >
                  {author?.name ?? id}
                  <button
                    type="button"
                    onClick={() => removeAuthor(id)}
                    className="ml-1 text-indigo-400 hover:text-indigo-600"
                    aria-label={`Remove ${author?.name ?? "author"}`}
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Add author search */}
        <div className="relative">
          <input
            type="text"
            value={authorSearch}
            onChange={(e) => {
              setAuthorSearch(e.target.value);
              setShowAuthorDropdown(true);
            }}
            onFocus={() => setShowAuthorDropdown(true)}
            onBlur={() => {
              // Small delay to allow click on dropdown item
              setTimeout(() => setShowAuthorDropdown(false), 200);
            }}
            placeholder="Search authors to add..."
            className={inputClass}
          />
          {showAuthorDropdown && authorSearch.trim() && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-stone-200 bg-white shadow-lg">
              {filteredAuthors.length === 0 ? (
                <div className="px-3 py-2 text-sm text-stone-500">
                  No matching authors
                </div>
              ) : (
                filteredAuthors.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addAuthor(a.id)}
                    className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {a.name}
                    {a.affiliation && (
                      <span className="ml-2 text-stone-400">
                        ({a.affiliation})
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      <hr className="border-stone-200" />

      {/* ----------------------------------------------------------------- */}
      {/* PDF section (shown at bottom in normal mode)                      */}
      {/* ----------------------------------------------------------------- */}
      {!isErratum && type !== "lecture_notes" && (
        <>
          {pdfSection}
          <hr className="border-stone-200" />
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Featured toggle (only for published articles, not errata)          */}
      {/* ----------------------------------------------------------------- */}
      {type === "published" && !isErratum && (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
          />
          Featured (show on homepage &ldquo;Selected Publications&rdquo;)
        </label>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Action buttons                                                    */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSubmit("draft")}
          disabled={saving || !title.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-stone-700 border border-stone-300 shadow-sm hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save as Draft"}
        </button>
        <button
          type="button"
          onClick={() => setShowPublishConfirm(true)}
          disabled={saving || !title.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Publish
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/articles")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors duration-150"
        >
          Cancel
        </button>
      </div>

      {/* Publish confirmation dialog */}
      {showPublishConfirm && (
        <ConfirmDialog
          title="Publish Article"
          message="Are you sure you want to publish this article? It will be publicly visible."
          confirmLabel="Publish"
          onConfirm={() => {
            setShowPublishConfirm(false);
            handleSubmit("published");
          }}
          onCancel={() => setShowPublishConfirm(false)}
        />
      )}
    </div>
  );
}
