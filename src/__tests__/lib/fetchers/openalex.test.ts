import { describe, it, expect } from "vitest";
import { parseOpenAlexAuthor } from "@/lib/fetchers/openalex";
import fixtureData from "../../fixtures/openalex-author-response.json";

describe("parseOpenAlexAuthor", () => {
  it("extracts display name", () => {
    const result = parseOpenAlexAuthor(fixtureData);
    expect(result.name).toBe("Konstantin Slutsky");
  });

  it("extracts OpenAlex ID stripped of URL prefix", () => {
    const result = parseOpenAlexAuthor(fixtureData);
    expect(result.openAlexId).toBe("A5023888391");
  });

  it("extracts ORCID stripped of URL prefix", () => {
    const result = parseOpenAlexAuthor(fixtureData);
    expect(result.orcid).toBe("0000-0002-1234-5678");
  });

  it("extracts affiliation from last_known_institutions", () => {
    const result = parseOpenAlexAuthor(fixtureData);
    expect(result.affiliation).toBe("Iowa State University");
  });

  it("handles missing orcid gracefully", () => {
    const data = { ...fixtureData, orcid: null };
    const result = parseOpenAlexAuthor(data);
    expect(result.orcid).toBeUndefined();
  });

  it("handles empty last_known_institutions gracefully", () => {
    const data = { ...fixtureData, last_known_institutions: [] };
    const result = parseOpenAlexAuthor(data);
    expect(result.affiliation).toBeUndefined();
  });
});
