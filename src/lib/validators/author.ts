import { z } from "zod";

export const orcidSchema = z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, "Invalid ORCID format");

export const authorCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  openAlexId: z.string().optional(),
  orcid: orcidSchema.optional(),
  affiliation: z.string().optional(),
  homepage: z.string().url().optional().or(z.literal("")),
});

export type AuthorCreateInput = z.infer<typeof authorCreateSchema>;
