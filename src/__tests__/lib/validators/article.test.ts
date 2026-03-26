import { describe, it, expect } from "vitest";
import { arxivIdSchema, articleCreateSchema } from "@/lib/validators/article";

describe("arxivIdSchema", () => {
  it("accepts new-style arXiv ID", () => {
    expect(arxivIdSchema.parse("2301.12345")).toBe("2301.12345");
  });

  it("accepts old-style arXiv ID", () => {
    expect(arxivIdSchema.parse("math/0601234")).toBe("math/0601234");
  });

  it("accepts old-style with subcategory", () => {
    expect(arxivIdSchema.parse("math.DS/0601234")).toBe("math.DS/0601234");
  });

  it("rejects invalid arXiv ID", () => {
    expect(() => arxivIdSchema.parse("not-an-id")).toThrow();
  });

  it("strips URL prefix", () => {
    expect(arxivIdSchema.parse("https://arxiv.org/abs/2301.12345")).toBe("2301.12345");
  });

  it("strips arxiv: prefix", () => {
    expect(arxivIdSchema.parse("arxiv:2301.12345")).toBe("2301.12345");
  });
});

describe("articleCreateSchema", () => {
  const baseArticle = {
    type: "published" as const,
    title: "A Test Article",
    status: "published" as const,
    publishedYear: 2023,
    publishedMonth: 6,
    publishedDay: 15,
  };

  it("accepts valid published article with full date", () => {
    const result = articleCreateSchema.parse(baseArticle);
    expect(result.title).toBe("A Test Article");
    expect(result.publishedYear).toBe(2023);
    expect(result.publishedMonth).toBe(6);
    expect(result.publishedDay).toBe(15);
  });

  it("rejects impossible calendar date (Feb 30)", () => {
    expect(() =>
      articleCreateSchema.parse({
        ...baseArticle,
        publishedYear: 2023,
        publishedMonth: 2,
        publishedDay: 30,
      })
    ).toThrow();
  });

  it("allows year-only date (month/day undefined)", () => {
    const result = articleCreateSchema.parse({
      type: "preprint" as const,
      title: "Year Only",
      publishedYear: 2022,
    });
    expect(result.publishedYear).toBe(2022);
    expect(result.publishedMonth).toBeUndefined();
    expect(result.publishedDay).toBeUndefined();
  });

  it("rejects erratum without parentId", () => {
    expect(() =>
      articleCreateSchema.parse({
        type: "erratum" as const,
        title: "An Erratum",
      })
    ).toThrow();
  });

  it("accepts erratum with parentId", () => {
    const result = articleCreateSchema.parse({
      type: "erratum" as const,
      title: "An Erratum",
      parentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.type).toBe("erratum");
    expect(result.parentId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});
