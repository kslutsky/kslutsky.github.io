import { z } from "zod";
import { SEMESTERS, ARTICLE_STATUSES } from "@/lib/types";

export const courseCreateSchema = z.object({
  courseNumber: z.string().default(""),
  courseTitle: z.string().min(1, "Course title is required"),
  semester: z.enum(SEMESTERS),
  year: z.number().int().min(1900).max(2100),
  institution: z.string().min(1, "Institution is required"),
  status: z.enum(ARTICLE_STATUSES).default("draft"),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
