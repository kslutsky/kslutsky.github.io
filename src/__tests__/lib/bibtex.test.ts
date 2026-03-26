import { describe, it, expect } from "vitest";
import { generateBibtex, buildDisambiguationMap } from "@/lib/bibtex";

describe("generateBibtex", () => {
  it("generates @article for a published paper with journal, volume, pages, doi", () => {
    const result = generateBibtex({
      type: "published",
      title: "Some Great Theorem",
      authors: ["Konstantin Slutsky", "Jane Doe"],
      journalName: "Annals of Mathematics",
      volume: "200",
      issue: "3",
      pages: "123--456",
      publishedYear: 2024,
      doi: "10.1234/annals.2024",
      arxivId: null,
      abstract: null,
    });

    expect(result).toContain("@article{Slutsky2024,");
    expect(result).toContain("title = {Some Great Theorem}");
    expect(result).toContain("author = {Slutsky, Konstantin and Doe, Jane}");
    expect(result).toContain("year = {2024}");
    expect(result).toContain("journal = {Annals of Mathematics}");
    expect(result).toContain("volume = {200}");
    expect(result).toContain("number = {3}");
    expect(result).toContain("pages = {123--456}");
    expect(result).toContain("doi = {10.1234/annals.2024}");
  });

  it("generates @unpublished for a preprint with eprint/archivePrefix", () => {
    const result = generateBibtex({
      type: "preprint",
      title: "A Preprint Paper",
      authors: ["Konstantin Slutsky"],
      journalName: null,
      volume: null,
      issue: null,
      pages: null,
      publishedYear: 2023,
      doi: null,
      arxivId: "2301.12345",
      abstract: "This is the abstract.",
    });

    expect(result).toContain("@unpublished{Slutsky2023,");
    expect(result).toContain("eprint = {2301.12345}");
    expect(result).toContain("archivePrefix = {arXiv}");
    expect(result).not.toContain("journal =");
    expect(result).not.toContain("volume =");
    expect(result).not.toContain("doi =");
  });

  it("generates @misc for an erratum", () => {
    const result = generateBibtex({
      type: "erratum",
      title: "Erratum to Some Paper",
      authors: ["Konstantin Slutsky"],
      journalName: "Annals of Mathematics",
      volume: null,
      issue: null,
      pages: null,
      publishedYear: 2025,
      doi: null,
      arxivId: null,
      abstract: null,
    });

    expect(result).toContain("@misc{Slutsky2025,");
    expect(result).toContain("journal = {Annals of Mathematics}");
  });

  it("omits null fields from output", () => {
    const result = generateBibtex({
      type: "published",
      title: "Paper Without Volume",
      authors: ["Konstantin Slutsky"],
      journalName: "Some Journal",
      volume: null,
      issue: null,
      pages: null,
      publishedYear: 2022,
      doi: null,
      arxivId: null,
      abstract: null,
    });

    expect(result).not.toContain("volume =");
    expect(result).not.toContain("number =");
    expect(result).not.toContain("pages =");
    expect(result).not.toContain("doi =");
    expect(result).not.toContain("eprint =");
    expect(result).not.toContain("archivePrefix =");
  });

  it("citation key uses LastName + Year", () => {
    const result = generateBibtex({
      type: "published",
      title: "Test",
      authors: ["Alice Wonderland"],
      journalName: null,
      volume: null,
      issue: null,
      pages: null,
      publishedYear: 2020,
      doi: null,
      arxivId: null,
      abstract: null,
    });

    expect(result).toContain("@article{Wonderland2020,");
  });

  it("falls back to createdAtYear when publishedYear is null", () => {
    const result = generateBibtex({
      type: "preprint",
      title: "No Year Paper",
      authors: ["Konstantin Slutsky"],
      journalName: null,
      volume: null,
      issue: null,
      pages: null,
      publishedYear: null,
      doi: null,
      arxivId: null,
      abstract: null,
      createdAtYear: 2021,
    });

    expect(result).toContain("Slutsky2021");
    expect(result).toContain("year = {2021}");
  });

  it("formats author names as Last, First", () => {
    const result = generateBibtex({
      type: "published",
      title: "Multi-Author",
      authors: ["John Smith", "Mary Johnson", "Already, Formatted"],
      journalName: null,
      volume: null,
      issue: null,
      pages: null,
      publishedYear: 2024,
      doi: null,
      arxivId: null,
      abstract: null,
    });

    expect(result).toContain(
      "author = {Smith, John and Johnson, Mary and Already, Formatted}"
    );
  });

  it("appends disambiguation suffix when provided", () => {
    const result = generateBibtex(
      {
        type: "published",
        title: "Another Paper",
        authors: ["Konstantin Slutsky"],
        journalName: null,
        volume: null,
        issue: null,
        pages: null,
        publishedYear: 2024,
        doi: null,
        arxivId: null,
        abstract: null,
      },
      "b"
    );

    expect(result).toContain("@article{Slutsky2024b,");
  });
});

describe("buildDisambiguationMap", () => {
  it("assigns 'a' and 'b' suffixes when two articles by same first author in same year", () => {
    const articles = [
      {
        id: "article-1",
        type: "published",
        authors: ["Konstantin Slutsky"],
        publishedYear: 2024,
        createdAtYear: 2023,
      },
      {
        id: "article-2",
        type: "published",
        authors: ["Konstantin Slutsky"],
        publishedYear: 2024,
        createdAtYear: 2022,
      },
    ];

    const map = buildDisambiguationMap(articles);

    const suffix1 = map.get("article-1");
    const suffix2 = map.get("article-2");

    // One should get "a" and the other "b"
    const suffixes = [suffix1, suffix2].sort();
    expect(suffixes).toEqual(["a", "b"]);
  });

  it("assigns empty string suffix for unique keys", () => {
    const articles = [
      {
        id: "article-1",
        type: "published",
        authors: ["Konstantin Slutsky"],
        publishedYear: 2024,
        createdAtYear: 2023,
      },
      {
        id: "article-2",
        type: "published",
        authors: ["Jane Doe"],
        publishedYear: 2024,
        createdAtYear: 2022,
      },
    ];

    const map = buildDisambiguationMap(articles);

    expect(map.get("article-1")).toBe("");
    expect(map.get("article-2")).toBe("");
  });

  it("handles null publishedYear with createdAtYear fallback", () => {
    const articles = [
      {
        id: "article-1",
        type: "preprint",
        authors: ["Konstantin Slutsky"],
        publishedYear: null,
        createdAtYear: 2023,
      },
      {
        id: "article-2",
        type: "preprint",
        authors: ["Konstantin Slutsky"],
        publishedYear: null,
        createdAtYear: 2023,
      },
    ];

    const map = buildDisambiguationMap(articles);

    const suffix1 = map.get("article-1");
    const suffix2 = map.get("article-2");

    const suffixes = [suffix1, suffix2].sort();
    expect(suffixes).toEqual(["a", "b"]);
  });
});
