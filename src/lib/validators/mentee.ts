import { z } from "zod";
import { MENTEE_CATEGORIES, ARTICLE_STATUSES } from "@/lib/types";

export const menteeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(MENTEE_CATEGORIES),
  institution: z.string().min(1, "Institution is required"),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100).optional(),
  thesisTitle: z.string().optional(),
  firstPosition: z.string().optional(),
  homepage: z.string().refine(
    (val) => val === "" || val.startsWith("https://") || val.startsWith("http://"),
    "Homepage must be an http(s) URL"
  ).optional().or(z.literal("")),
  status: z.enum(ARTICLE_STATUSES).default("draft"),
});

export type MenteeCreateInput = z.infer<typeof menteeCreateSchema>;
