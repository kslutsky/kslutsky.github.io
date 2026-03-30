import { fetchWithTimeout } from "./utils";

export interface OpenAlexAuthorResult {
  name: string;
  openAlexId: string;
  orcid?: string;
  affiliation?: string;
}

const OPENALEX_BASE_URL = "https://api.openalex.org";
const OPENALEX_ID_PREFIX = "https://openalex.org/";
const ORCID_PREFIX = "https://orcid.org/";

export function parseOpenAlexAuthor(data: any): OpenAlexAuthorResult {
  const name: string = data.display_name;

  const rawId: string = data.id ?? "";
  const openAlexId = rawId.startsWith(OPENALEX_ID_PREFIX)
    ? rawId.slice(OPENALEX_ID_PREFIX.length)
    : rawId;

  let orcid: string | undefined;
  if (data.orcid) {
    const rawOrcid: string = data.orcid;
    orcid = rawOrcid.startsWith(ORCID_PREFIX)
      ? rawOrcid.slice(ORCID_PREFIX.length)
      : rawOrcid;
  }

  const institutions: any[] = data.last_known_institutions ?? [];
  const affiliation: string | undefined =
    institutions.length > 0 ? institutions[0].display_name : undefined;

  return { name, openAlexId, orcid, affiliation };
}

export async function fetchOpenAlexAuthor(query: string): Promise<OpenAlexAuthorResult> {
  const headers = {
    "User-Agent": "kslutsky.github.io/1.0 (mailto:kslutsky@iastate.edu)",
  };

  let url: string;

  // OpenAlex ID: starts with "A" followed by digits
  if (/^A\d+$/.test(query)) {
    url = `${OPENALEX_BASE_URL}/authors/${query}`;
  }
  // ORCID format: 0000-0000-0000-0000
  else if (/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(query)) {
    url = `${OPENALEX_BASE_URL}/authors/orcid:${query}`;
  }
  // Name search
  else {
    const params = new URLSearchParams({ search: query, per_page: "1" });
    url = `${OPENALEX_BASE_URL}/authors?${params.toString()}`;
  }

  const response = await fetchWithTimeout(url, { headers });

  if (!response.ok) {
    throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Name search returns a results array; direct lookups return the object directly
  if (data.results) {
    if (data.results.length === 0) {
      throw new Error(`No OpenAlex author found for query: ${query}`);
    }
    return parseOpenAlexAuthor(data.results[0]);
  }

  return parseOpenAlexAuthor(data);
}
