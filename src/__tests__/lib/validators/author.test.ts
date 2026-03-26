import { describe, it, expect } from "vitest";
import { authorCreateSchema } from "@/lib/validators/author";

describe("authorCreateSchema", () => {
  it("accepts valid author with just name", () => {
    const result = authorCreateSchema.parse({ name: "Jane Doe" });
    expect(result.name).toBe("Jane Doe");
  });

  it("rejects empty name", () => {
    expect(() => authorCreateSchema.parse({ name: "" })).toThrow();
  });

  it("accepts valid ORCID", () => {
    const result = authorCreateSchema.parse({
      name: "Jane Doe",
      orcid: "0000-0002-1234-5678",
    });
    expect(result.orcid).toBe("0000-0002-1234-5678");
  });

  it("rejects invalid ORCID", () => {
    expect(() =>
      authorCreateSchema.parse({
        name: "Jane Doe",
        orcid: "not-orcid",
      })
    ).toThrow();
  });
});
