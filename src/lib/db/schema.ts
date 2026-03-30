import {
  pgTable, uuid, text, integer, timestamp, index, check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => articles.id),
    arxivId: text("arxiv_id").unique(),
    arxivVersion: integer("arxiv_version"),
    doi: text("doi").unique(),
    title: text("title").notNull(),
    abstract: text("abstract"),
    pdfUrl: text("pdf_url"),
    pdfSource: text("pdf_source"),
    journalName: text("journal_name"),
    volume: text("volume"),
    issue: text("issue"),
    pages: text("pages"),
    publishedYear: integer("published_year"),
    publishedMonth: integer("published_month"),
    publishedDay: integer("published_day"),
    authorIds: uuid("author_ids").array().notNull().default(sql`'{}'::uuid[]`),
    tagIds: uuid("tag_ids").array().notNull().default(sql`'{}'::uuid[]`),
    featured: integer("featured").notNull().default(0),
    status: text("status").notNull().default("draft"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("articles_status_idx").on(table.status),
    index("articles_author_ids_gin_idx").using("gin", table.authorIds),
    index("articles_tag_ids_gin_idx").using("gin", table.tagIds),
    check("type_check", sql`${table.type} IN ('preprint', 'published', 'erratum', 'notes')`),
    check("status_check", sql`${table.status} IN ('draft', 'published')`),
    check("erratum_parent_check", sql`(${table.type} = 'erratum' AND ${table.parentId} IS NOT NULL) OR (${table.type} != 'erratum' AND ${table.parentId} IS NULL)`),
    check("pdf_source_check", sql`${table.pdfSource} IS NULL OR ${table.pdfSource} IN ('arxiv', 'upload', 'external')`),
    check("pdf_source_arxiv_check", sql`${table.pdfSource} != 'arxiv' OR ${table.arxivId} IS NOT NULL`),
    check("pdf_source_upload_check", sql`${table.pdfSource} != 'upload' OR ${table.pdfUrl} IS NOT NULL`),
    check("pdf_source_external_check", sql`${table.pdfSource} != 'external' OR ${table.pdfUrl} IS NOT NULL`),
    check("published_year_check", sql`${table.publishedYear} IS NULL OR (${table.publishedYear} >= 1900 AND ${table.publishedYear} <= 2100)`),
    check("published_month_check", sql`${table.publishedMonth} IS NULL OR (${table.publishedMonth} >= 1 AND ${table.publishedMonth} <= 12)`),
    check("published_day_check", sql`${table.publishedDay} IS NULL OR (${table.publishedDay} >= 1 AND ${table.publishedDay} <= 31)`),
  ]
);

export const authors = pgTable("authors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  openAlexId: text("open_alex_id").unique(),
  orcid: text("orcid").unique(),
  affiliation: text("affiliation"),
  homepage: text("homepage"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),
  },
  (table) => [
    check("tag_type_check", sql`${table.type} IN ('keyword', 'arxiv_subject', 'msc_code')`),
  ]
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseNumber: text("course_number").notNull(),
    courseTitle: text("course_title").notNull(),
    semester: text("semester").notNull(),
    year: integer("year").notNull(),
    institution: text("institution").notNull(),
    status: text("status").notNull().default("draft"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("courses_status_idx").on(table.status),
    index("courses_institution_idx").on(table.institution),
    check("courses_status_check", sql`${table.status} IN ('draft', 'published')`),
    check("courses_semester_check", sql`${table.semester} IN ('Fall', 'Spring', 'Summer')`),
    check("courses_year_check", sql`${table.year} >= 1900 AND ${table.year} <= 2100`),
  ]
);

export const mentees = pgTable(
  "mentees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    institution: text("institution").notNull(),
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year"),
    thesisTitle: text("thesis_title"),
    firstPosition: text("first_position"),
    homepage: text("homepage"),
    status: text("status").notNull().default("draft"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("mentees_status_idx").on(table.status),
    index("mentees_category_idx").on(table.category),
    check("mentees_status_check", sql`${table.status} IN ('draft', 'published')`),
    check("mentees_category_check", sql`${table.category} IN ('phd', 'postdoc', 'masters', 'undergraduate')`),
    check("mentees_start_year_check", sql`${table.startYear} >= 1900 AND ${table.startYear} <= 2100`),
    check("mentees_end_year_check", sql`${table.endYear} IS NULL OR (${table.endYear} >= 1900 AND ${table.endYear} <= 2100)`),
  ]
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
