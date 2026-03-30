"use server";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { authors } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { fetchArxivMetadata, type ArxivResult } from "@/lib/fetchers/arxiv";
import { fetchCrossRefMetadata, type CrossRefResult } from "@/lib/fetchers/crossref";
import { fetchOpenAlexAuthor, type OpenAlexAuthorResult } from "@/lib/fetchers/openalex";
import type { ActionResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Author = typeof authors.$inferSelect;

export type MatchResult = {
  matched: { fetchedName: string; author: Author }[];
  unmatched: { fetchedName: string; candidates: Author[] }[];
};

// ---------------------------------------------------------------------------
// Metadata fetchers
// ---------------------------------------------------------------------------

export async function fetchArxiv(
  arxivId: string
): Promise<ActionResult<ArxivResult>> {
  await requireAuth();

  try {
    const result = await fetchArxivMetadata(arxivId);
    return { success: true, data: result };
  } catch (error) {
    console.error("[fetchArxiv]", error);
    return {
      success: false,
      error: "Failed to fetch arXiv metadata. Please try again.",
    };
  }
}

export async function fetchDoi(
  doi: string
): Promise<ActionResult<CrossRefResult>> {
  await requireAuth();

  try {
    const result = await fetchCrossRefMetadata(doi);
    return { success: true, data: result };
  } catch (error) {
    console.error("[fetchDoi]", error);
    return {
      success: false,
      error: "Failed to fetch CrossRef metadata. Please try again.",
    };
  }
}

export async function fetchAuthorMetadata(
  query: string
): Promise<ActionResult<OpenAlexAuthorResult>> {
  await requireAuth();

  try {
    const result = await fetchOpenAlexAuthor(query);
    return { success: true, data: result };
  } catch (error) {
    console.error("[fetchAuthorMetadata]", error);
    return {
      success: false,
      error: "Failed to fetch author metadata. Please try again.",
    };
  }
}

// ---------------------------------------------------------------------------
// Author matching
// ---------------------------------------------------------------------------

export async function matchAuthors(
  fetchedNames: string[],
  fetchedOrcids: (string | undefined)[]
): Promise<ActionResult<MatchResult>> {
  await requireAuth();

  try {
    const matched: MatchResult["matched"] = [];
    const unmatched: MatchResult["unmatched"] = [];

    const allAuthors = await db.select().from(authors);

    // Build lookup maps for O(1) matching
    const byOrcid = new Map<string, Author>();
    const byNameLower = new Map<string, Author>();
    for (const a of allAuthors) {
      if (a.orcid) byOrcid.set(a.orcid, a);
      byNameLower.set(a.name.toLowerCase(), a);
    }

    for (let i = 0; i < fetchedNames.length; i++) {
      const name = fetchedNames[i];
      const orcid = fetchedOrcids[i];

      // (a) Try ORCID match first, then case-insensitive name
      const found = (orcid && byOrcid.get(orcid)) || byNameLower.get(name.toLowerCase());

      if (found) {
        matched.push({ fetchedName: name, author: found });
      } else {
        // No exact match — return all authors as candidates for the UI
        unmatched.push({ fetchedName: name, candidates: allAuthors });
      }
    }

    return { success: true, data: { matched, unmatched } };
  } catch (error) {
    console.error("[matchAuthors]", error);
    return {
      success: false,
      error: "Failed to match authors. Please try again.",
    };
  }
}
