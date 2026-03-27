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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch arXiv metadata",
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch CrossRef metadata",
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch author metadata",
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

    // Fetch all authors once for fallback candidate matching
    const allAuthors = await db.select().from(authors);

    for (let i = 0; i < fetchedNames.length; i++) {
      const name = fetchedNames[i];
      const orcid = fetchedOrcids[i];
      let found: Author | undefined;

      // (a) If ORCID provided, query by exact ORCID match
      if (orcid) {
        const [byOrcid] = await db
          .select()
          .from(authors)
          .where(sql`${authors.orcid} = ${orcid}`);
        if (byOrcid) {
          found = byOrcid;
        }
      }

      // (b) If no ORCID match, query by case-insensitive name
      if (!found) {
        const [byName] = await db
          .select()
          .from(authors)
          .where(sql`LOWER(${authors.name}) = LOWER(${name})`);
        if (byName) {
          found = byName;
        }
      }

      if (found) {
        matched.push({ fetchedName: name, author: found });
      } else {
        // (c) No exact match — return all authors as candidates for the UI
        unmatched.push({ fetchedName: name, candidates: allAuthors });
      }
    }

    return { success: true, data: { matched, unmatched } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to match authors",
    };
  }
}
