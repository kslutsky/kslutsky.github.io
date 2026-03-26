import { describe, it, expect } from "vitest";
import { parseCrossRefResponse } from "@/lib/fetchers/crossref";
import fixtureResponse from "../../fixtures/crossref-response.json";

describe("parseCrossRefResponse", () => {
  const message = fixtureResponse.message;

  it("extracts the title", () => {
    const result = parseCrossRefResponse(message);
    expect(result.title).toBe("Smooth Orbit Equivalence of Flows");
  });

  it("strips JATS tags from abstract", () => {
    const result = parseCrossRefResponse(message);
    expect(result.abstract).toBe(
      "We study smooth orbit equivalence of measure-preserving flows."
    );
    expect(result.abstract).not.toContain("<jats:");
    expect(result.abstract).not.toContain("</jats:");
  });

  it("extracts authors with ORCID when available", () => {
    const result = parseCrossRefResponse(message);
    expect(result.authors).toHaveLength(2);
    expect(result.authors[0].name).toBe("Konstantin Slutsky");
    expect(result.authors[0].orcid).toBe("0000-0002-1234-5678");
  });

  it("sets orcid to undefined when not available", () => {
    const result = parseCrossRefResponse(message);
    expect(result.authors[1].name).toBe("Jane Doe");
    expect(result.authors[1].orcid).toBeUndefined();
  });

  it("extracts journal name", () => {
    const result = parseCrossRefResponse(message);
    expect(result.journalName).toBe("Inventiones Mathematicae");
  });

  it("extracts volume", () => {
    const result = parseCrossRefResponse(message);
    expect(result.volume).toBe("381");
  });

  it("extracts issue", () => {
    const result = parseCrossRefResponse(message);
    expect(result.issue).toBe("2");
  });

  it("extracts pages", () => {
    const result = parseCrossRefResponse(message);
    expect(result.pages).toBe("100-150");
  });

  it("extracts publication year", () => {
    const result = parseCrossRefResponse(message);
    expect(result.publishedYear).toBe(2024);
  });

  it("extracts publication month", () => {
    const result = parseCrossRefResponse(message);
    expect(result.publishedMonth).toBe(3);
  });

  it("extracts publication day", () => {
    const result = parseCrossRefResponse(message);
    expect(result.publishedDay).toBe(15);
  });

  it("extracts DOI", () => {
    const result = parseCrossRefResponse(message);
    expect(result.doi).toBe("10.1007/s00222-024-01234-5");
  });

  it("handles published-online date when published-print is absent", () => {
    const onlineMessage = {
      ...message,
      "published-print": undefined,
      "published-online": {
        "date-parts": [[2023, 11, 5]],
      },
    };
    const result = parseCrossRefResponse(onlineMessage);
    expect(result.publishedYear).toBe(2023);
    expect(result.publishedMonth).toBe(11);
    expect(result.publishedDay).toBe(5);
  });
});
