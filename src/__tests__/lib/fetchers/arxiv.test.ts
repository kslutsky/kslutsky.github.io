import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { normalizeArxivId, parseArxivResponse } from "@/lib/fetchers/arxiv";

const fixtureXml = readFileSync(
  join(__dirname, "../../fixtures/arxiv-response.xml"),
  "utf-8"
);

describe("normalizeArxivId", () => {
  it("strips https://arxiv.org/abs/ URL prefix and version suffix", () => {
    expect(normalizeArxivId("https://arxiv.org/abs/2301.12345v2")).toBe(
      "2301.12345"
    );
  });

  it("strips http://arxiv.org/abs/ URL prefix and version suffix", () => {
    expect(normalizeArxivId("http://arxiv.org/abs/2301.12345v2")).toBe(
      "2301.12345"
    );
  });

  it("strips arxiv: prefix and version suffix", () => {
    expect(normalizeArxivId("arxiv:2301.12345v2")).toBe("2301.12345");
  });

  it("strips version suffix without prefix", () => {
    expect(normalizeArxivId("2301.12345v2")).toBe("2301.12345");
  });

  it("keeps old-style ID (no dot, no version)", () => {
    expect(normalizeArxivId("math/0601234")).toBe("math/0601234");
  });

  it("keeps plain new-style ID without version", () => {
    expect(normalizeArxivId("2301.12345")).toBe("2301.12345");
  });
});

describe("parseArxivResponse", () => {
  it("extracts the title", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.title).toBe("A Very Important Theorem About Groups");
  });

  it("extracts the abstract", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.abstract).toBe(
      "We prove that every countable group acts freely on something interesting. This has applications to ergodic theory."
    );
  });

  it("extracts authors in order", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.authors).toEqual(["Konstantin Slutsky", "Jane Doe"]);
  });

  it("extracts arxivId without version", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.arxivId).toBe("2301.12345");
  });

  it("extracts version number", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.arxivVersion).toBe(2);
  });

  it("extracts PDF URL", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.pdfUrl).toBe("http://arxiv.org/pdf/2301.12345v2");
  });

  it("extracts primary category", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.primaryCategory).toBe("math.DS");
  });

  it("extracts all categories", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.categories).toEqual(["math.DS", "math.GR"]);
  });

  it("extracts published year", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.publishedYear).toBe(2023);
  });

  it("extracts published month", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.publishedMonth).toBe(1);
  });

  it("extracts published day", () => {
    const result = parseArxivResponse(fixtureXml);
    expect(result.publishedDay).toBe(30);
  });
});
