export interface BibTexInput {
  type: "preprint" | "published" | "erratum";
  title: string;
  authors: string[];
  journalName?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  publishedYear: number | null;
  doi?: string | null;
  arxivId?: string | null;
  abstract?: string | null;
  createdAtYear?: number;
}

/**
 * Converts a full name like "Konstantin Slutsky" to "Slutsky, Konstantin".
 * If the name already contains a comma, it is returned as-is.
 */
function formatAuthorName(name: string): string {
  if (name.includes(",")) {
    return name;
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }
  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, parts.length - 1).join(" ");
  return `${lastName}, ${firstNames}`;
}

/**
 * Extracts the last name from a full name. If the name contains a comma,
 * the part before the comma is treated as the last name.
 */
function extractLastName(name: string): string {
  if (name.includes(",")) {
    return name.split(",")[0].trim();
  }
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}

/**
 * Generates a single BibTeX entry string.
 */
export function generateBibtex(
  input: BibTexInput,
  disambiguationSuffix?: string
): string {
  const {
    type,
    title,
    authors,
    journalName,
    volume,
    issue,
    pages,
    publishedYear,
    doi,
    arxivId,
    abstract,
    createdAtYear,
  } = input;

  // Determine entry type
  const entryType =
    type === "published"
      ? "article"
      : type === "preprint"
        ? "unpublished"
        : "misc";

  // Determine year for citation key and year field
  const year = publishedYear ?? createdAtYear ?? null;

  // Build citation key
  const firstAuthorLastName =
    authors.length > 0 ? extractLastName(authors[0]) : "Unknown";
  const suffix = disambiguationSuffix ?? "";
  const citationKey = `${firstAuthorLastName}${year ?? ""}${suffix}`;

  // Format authors
  const formattedAuthors = authors.map(formatAuthorName).join(" and ");

  // Collect fields (only non-null / non-undefined)
  const fields: Array<[string, string]> = [];

  fields.push(["title", title]);
  fields.push(["author", formattedAuthors]);

  if (year !== null) {
    fields.push(["year", String(year)]);
  }

  if (journalName != null) {
    fields.push(["journal", journalName]);
  }

  if (volume != null) {
    fields.push(["volume", volume]);
  }

  if (issue != null) {
    fields.push(["number", issue]);
  }

  if (pages != null) {
    fields.push(["pages", pages]);
  }

  if (doi != null) {
    fields.push(["doi", doi]);
  }

  if (arxivId != null) {
    fields.push(["eprint", arxivId]);
    fields.push(["archivePrefix", "arXiv"]);
  }

  if (abstract != null) {
    fields.push(["abstract", abstract]);
  }

  // Render
  const fieldLines = fields
    .map(([key, value]) => `  ${key} = {${value}}`)
    .join(",\n");

  return `@${entryType}{${citationKey},\n${fieldLines}\n}`;
}

interface ArticleForDisambiguation {
  id: string;
  type: string;
  authors: string[];
  publishedYear: number | null;
  createdAtYear: number;
}

/**
 * Builds a map from article ID to disambiguation suffix ("", "a", "b", ...).
 * Articles that share the same citation key base (LastName + Year) receive
 * suffixes "a", "b", etc. Articles with unique keys receive "".
 */
export function buildDisambiguationMap(
  articles: ArticleForDisambiguation[]
): Map<string, string> {
  // Compute base key for each article
  const baseKeys: Array<{ id: string; baseKey: string }> = articles.map(
    (article) => {
      const year = article.publishedYear ?? article.createdAtYear;
      const lastName =
        article.authors.length > 0
          ? extractLastName(article.authors[0])
          : "Unknown";
      return { id: article.id, baseKey: `${lastName}${year}` };
    }
  );

  // Group by base key
  const groups = new Map<string, string[]>();
  for (const { id, baseKey } of baseKeys) {
    const group = groups.get(baseKey) ?? [];
    group.push(id);
    groups.set(baseKey, group);
  }

  // Assign suffixes
  const result = new Map<string, string>();
  for (const [, ids] of groups) {
    if (ids.length === 1) {
      result.set(ids[0], "");
    } else {
      ids.forEach((id, index) => {
        // 'a' = 97 in ASCII
        result.set(id, String.fromCharCode(97 + index));
      });
    }
  }

  return result;
}
