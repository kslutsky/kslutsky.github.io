import { fetchWithTimeout } from "./utils";

export interface CrossRefAuthor {
  name: string;
  orcid?: string;
}

export interface CrossRefResult {
  doi: string;
  title: string;
  abstract: string;
  authors: CrossRefAuthor[];
  journalName: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publishedYear?: number;
  publishedMonth?: number;
  publishedDay?: number;
}

function stripJatsTags(text: string): string {
  return text.replace(/<\/?jats:[^>]*>/g, "").trim();
}

function extractOrcid(orcidUrl?: string): string | undefined {
  if (!orcidUrl) return undefined;
  const prefix = "https://orcid.org/";
  if (orcidUrl.startsWith(prefix)) {
    return orcidUrl.slice(prefix.length);
  }
  return orcidUrl;
}

function extractDateParts(
  message: any
): Pick<CrossRefResult, "publishedYear" | "publishedMonth" | "publishedDay"> {
  const dateField =
    message["published-print"] ?? message["published-online"];
  if (!dateField) return {};
  const dateParts: (number | undefined)[] =
    dateField["date-parts"]?.[0] ?? [];
  return {
    publishedYear: dateParts[0],
    publishedMonth: dateParts[1],
    publishedDay: dateParts[2],
  };
}

export function parseCrossRefResponse(message: any): CrossRefResult {
  const title: string = Array.isArray(message.title)
    ? message.title[0]
    : message.title ?? "";

  const abstract: string = message.abstract
    ? stripJatsTags(message.abstract)
    : "";

  const authors: CrossRefAuthor[] = (message.author ?? []).map(
    (a: any): CrossRefAuthor => ({
      name: [a.given, a.family].filter(Boolean).join(" "),
      orcid: extractOrcid(a.ORCID),
    })
  );

  const journalName: string = Array.isArray(message["container-title"])
    ? message["container-title"][0]
    : message["container-title"] ?? "";

  const dateParts = extractDateParts(message);

  return {
    doi: message.DOI ?? "",
    title,
    abstract,
    authors,
    journalName,
    volume: message.volume,
    issue: message.issue,
    pages: message.page,
    ...dateParts,
  };
}

export async function fetchCrossRefMetadata(
  doi: string
): Promise<CrossRefResult> {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent":
        "kslutsky-homepage/1.0 (https://kslutsky.github.io; mailto:admin@example.com)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `CrossRef API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return parseCrossRefResponse(data.message);
}
