import { z } from "zod";
import { ARTICLE_TYPES, ARTICLE_STATUSES, PDF_SOURCES } from "@/lib/types";

export const arxivIdSchema = z
  .string()
  .transform((val) => {
    val = val.replace(/^https?:\/\/arxiv\.org\/abs\//, "");
    val = val.replace(/^arxiv:/, "");
    return val;
  })
  .pipe(
    z.string().regex(
      /^(\d{4}\.\d{4,5}(v\d+)?|[a-zA-Z-]+(\.[A-Z]{2})?\/\d{7}(v\d+)?)$/,
      "Invalid arXiv ID format"
    )
  )
  .transform((val) => val.replace(/v\d+$/, "")); // Version stripped — extracted separately by fetcher

export const doiSchema = z.string().regex(/^10\.\d{4,9}\//, "Invalid DOI format");

// Date validation helper
function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export const articleCreateSchema = z
  .object({
    type: z.enum(ARTICLE_TYPES),
    parentId: z.string().uuid().optional(),
    arxivId: arxivIdSchema.optional(),
    arxivVersion: z.number().int().positive().optional(),
    doi: doiSchema.optional(),
    title: z.string().min(1, "Title is required"),
    abstract: z.string().optional(),
    pdfUrl: z.string().min(1).optional(), // Accepts both absolute URLs and relative paths like /papers/...
    pdfSource: z.enum(PDF_SOURCES).optional(),
    journalName: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    publishedYear: z.number().int().min(1900).max(2100).optional(),
    publishedMonth: z.number().int().min(1).max(12).optional(),
    publishedDay: z.number().int().min(1).max(31).optional(),
    authorIds: z.array(z.string().uuid()).default([]),
    tagIds: z.array(z.string().uuid()).default([]),
    status: z.enum(ARTICLE_STATUSES).default("draft"),
  })
  .refine(
    (data) => {
      if (data.type === "erratum" && !data.parentId) return false;
      if (data.type !== "erratum" && data.parentId) return false;
      return true;
    },
    { message: "Errata must have parentId; non-errata must not" }
  )
  .refine(
    (data) => {
      if (data.publishedYear != null && data.publishedMonth != null && data.publishedDay != null) {
        return isValidDate(data.publishedYear, data.publishedMonth, data.publishedDay);
      }
      return true;
    },
    { message: "Invalid calendar date" }
  );

export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;
