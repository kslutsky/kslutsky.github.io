"use client";

import { useState } from "react";
import type { MatchResult } from "@/lib/actions/fetch-metadata";

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

interface AuthorMatcherProps {
  fetchedAuthors: { name: string; orcid?: string }[];
  matchResult: MatchResult;
  existingAuthors: Author[];
  onConfirm: (authorIds: string[]) => void;
  onCancel: () => void;
}

type Resolution =
  | { type: "matched"; authorId: string }
  | { type: "selected"; authorId: string }
  | { type: "create" };

export default function AuthorMatcher({
  fetchedAuthors,
  matchResult,
  existingAuthors,
  onConfirm,
  onCancel,
}: AuthorMatcherProps) {
  // Build initial resolutions from match result
  const initialResolutions: Record<number, Resolution> = {};

  fetchedAuthors.forEach((fetched, idx) => {
    const match = matchResult.matched.find(
      (m) => m.fetchedName === fetched.name
    );
    if (match) {
      initialResolutions[idx] = { type: "matched", authorId: match.author.id };
    } else {
      const unmatch = matchResult.unmatched.find(
        (u) => u.fetchedName === fetched.name
      );
      if (unmatch && unmatch.candidates.length === 0) {
        initialResolutions[idx] = { type: "create" };
      } else {
        // Default to "create" for unmatched with candidates
        initialResolutions[idx] = { type: "create" };
      }
    }
  });

  const [resolutions, setResolutions] =
    useState<Record<number, Resolution>>(initialResolutions);
  const [confirming, setConfirming] = useState(false);

  function handleSelectionChange(idx: number, value: string) {
    if (value === "__create__") {
      setResolutions((prev) => ({ ...prev, [idx]: { type: "create" } }));
    } else {
      setResolutions((prev) => ({
        ...prev,
        [idx]: { type: "selected", authorId: value },
      }));
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    const authorIds: string[] = [];

    for (let i = 0; i < fetchedAuthors.length; i++) {
      const res = resolutions[i];
      if (res.type === "matched" || res.type === "selected") {
        authorIds.push(res.authorId);
      } else {
        // "create" -- pass empty string as placeholder; form will handle creation
        authorIds.push("");
      }
    }

    onConfirm(authorIds);
  }

  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-stone-800">
        Match Fetched Authors
      </h3>

      <div className="space-y-2">
        {fetchedAuthors.map((fetched, idx) => {
          const res = resolutions[idx];
          const isMatched = res.type === "matched";
          const matchedAuthor = isMatched
            ? existingAuthors.find((a) => a.id === res.authorId)
            : null;

          // Find unmatched entry to get candidates
          const unmatchEntry = matchResult.unmatched.find(
            (u) => u.fetchedName === fetched.name
          );
          const hasCandidates =
            unmatchEntry && unmatchEntry.candidates.length > 0;

          return (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm flex-wrap"
            >
              <span className="font-medium text-stone-700 min-w-[150px]">
                {fetched.name}
              </span>

              <span className="text-stone-400">&rarr;</span>

              {isMatched && matchedAuthor ? (
                <span className="inline-flex items-center gap-1 text-green-700">
                  <svg
                    className="h-4 w-4 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  Matched to {matchedAuthor.name}
                </span>
              ) : hasCandidates ? (
                <select
                  value={
                    res.type === "selected" ? res.authorId : "__create__"
                  }
                  onChange={(e) => handleSelectionChange(idx, e.target.value)}
                  className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-150"
                >
                  <option value="__create__">Create new author</option>
                  {unmatchEntry!.candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                      {candidate.orcid ? ` (${candidate.orcid})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-stone-500 italic">
                  Will create new author
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirming ? "Confirming..." : "Confirm Authors"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-stone-700 border border-stone-300 shadow-sm hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
