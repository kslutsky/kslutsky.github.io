export interface ArxivResult {
  arxivId: string;
  arxivVersion: number;
  title: string;
  abstract: string;
  authors: string[];
  pdfUrl: string;
  primaryCategory: string;
  categories: string[];
  publishedYear: number;
  publishedMonth: number;
  publishedDay: number;
}

/**
 * Normalizes an arXiv ID by stripping URL prefixes and version suffixes.
 * Handles: https://arxiv.org/abs/XXXX, http://arxiv.org/abs/XXXX, arxiv:XXXX, or bare IDs.
 */
export function normalizeArxivId(input: string): string {
  let id = input.trim();

  // Strip URL prefix
  id = id.replace(/^https?:\/\/arxiv\.org\/abs\//, "");

  // Strip arxiv: prefix
  id = id.replace(/^arxiv:/i, "");

  // Strip version suffix (e.g., v2)
  id = id.replace(/v\d+$/, "");

  return id;
}

/**
 * Parses an arXiv Atom feed XML string and returns structured metadata.
 * Uses regex-based parsing to avoid DOM/XML dependencies.
 */
export function parseArxivResponse(xml: string): ArxivResult {
  // Extract the first <entry> block
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch) {
    throw new Error("No <entry> found in arXiv response");
  }
  const entry = entryMatch[1];

  // Extract id
  const idMatch = entry.match(/<id>\s*(.*?)\s*<\/id>/);
  if (!idMatch) throw new Error("No <id> found in arXiv entry");
  const rawId = idMatch[1].trim();
  const arxivId = normalizeArxivId(rawId);

  // Extract version from raw id
  const versionMatch = rawId.match(/v(\d+)$/);
  const arxivVersion = versionMatch ? parseInt(versionMatch[1], 10) : 1;

  // Extract title (strip whitespace)
  const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
  if (!titleMatch) throw new Error("No <title> found in arXiv entry");
  const title = titleMatch[1].trim();

  // Extract summary / abstract
  const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
  if (!summaryMatch) throw new Error("No <summary> found in arXiv entry");
  const abstract = summaryMatch[1].trim();

  // Extract all authors (preserving order)
  const authorRegex = /<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g;
  const authors: string[] = [];
  let authorMatch: RegExpExecArray | null;
  while ((authorMatch = authorRegex.exec(entry)) !== null) {
    authors.push(authorMatch[1].trim());
  }

  // Extract published date: parse by splitting ISO string directly (no new Date() to avoid timezone issues)
  const publishedMatch = entry.match(/<published>\s*(.*?)\s*<\/published>/);
  if (!publishedMatch) throw new Error("No <published> found in arXiv entry");
  const publishedStr = publishedMatch[1].trim();
  const dateParts = publishedStr.split("T")[0].split("-").map(Number);
  const publishedYear = dateParts[0];
  const publishedMonth = dateParts[1];
  const publishedDay = dateParts[2];

  // Extract primary category
  const primaryCategoryMatch = entry.match(/<arxiv:primary_category[^>]+term="([^"]+)"/);
  if (!primaryCategoryMatch)
    throw new Error("No <arxiv:primary_category> found in arXiv entry");
  const primaryCategory = primaryCategoryMatch[1];

  // Extract all categories
  const categoryRegex = /<category[^>]+term="([^"]+)"/g;
  const categories: string[] = [];
  let categoryMatch: RegExpExecArray | null;
  while ((categoryMatch = categoryRegex.exec(entry)) !== null) {
    categories.push(categoryMatch[1]);
  }

  // Extract PDF link (link with title="pdf" — attribute order varies)
  const pdfLinkMatch = entry.match(/<link[^>]+href="([^"]+)"[^>]+title="pdf"/);
  const pdfLinkMatchAlt = entry.match(/<link[^>]+title="pdf"[^>]+href="([^"]+)"/);
  const pdfUrl = (pdfLinkMatch ?? pdfLinkMatchAlt)?.[1] ?? `https://arxiv.org/pdf/${arxivId}`;

  return {
    arxivId,
    arxivVersion,
    title,
    abstract,
    authors,
    pdfUrl,
    primaryCategory,
    categories,
    publishedYear,
    publishedMonth,
    publishedDay,
  };
}

// Rate limiter: minimum 3 seconds between arXiv API calls
let lastArxivCall = 0;
async function arxivRateLimit(): Promise<void> {
  const elapsed = Date.now() - lastArxivCall;
  if (elapsed < 3000) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 3000 - elapsed);
    });
  }
  lastArxivCall = Date.now();
}

/**
 * Fetches metadata for a given arXiv ID from the arXiv API.
 * Applies a rate limiter (3-second minimum between calls).
 */
export async function fetchArxivMetadata(arxivId: string): Promise<ArxivResult> {
  const normalizedId = normalizeArxivId(arxivId);
  await arxivRateLimit();

  const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(normalizedId)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "kslutsky-homepage/1.0 (https://kslutsky.github.io; mailto:kslutsky@example.com)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `arXiv API request failed: ${response.status} ${response.statusText}`
    );
  }

  const xml = await response.text();
  return parseArxivResponse(xml);
}
