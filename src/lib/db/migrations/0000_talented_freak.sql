CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"parent_id" uuid,
	"arxiv_id" text,
	"arxiv_version" integer,
	"doi" text,
	"title" text NOT NULL,
	"abstract" text,
	"pdf_url" text,
	"pdf_source" text,
	"journal_name" text,
	"volume" text,
	"issue" text,
	"pages" text,
	"published_year" integer,
	"published_month" integer,
	"published_day" integer,
	"author_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"tag_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_arxiv_id_unique" UNIQUE("arxiv_id"),
	CONSTRAINT "articles_doi_unique" UNIQUE("doi"),
	CONSTRAINT "type_check" CHECK ("articles"."type" IN ('preprint', 'published', 'erratum')),
	CONSTRAINT "status_check" CHECK ("articles"."status" IN ('draft', 'published')),
	CONSTRAINT "erratum_parent_check" CHECK (("articles"."type" = 'erratum' AND "articles"."parent_id" IS NOT NULL) OR ("articles"."type" != 'erratum' AND "articles"."parent_id" IS NULL)),
	CONSTRAINT "pdf_source_check" CHECK ("articles"."pdf_source" IS NULL OR "articles"."pdf_source" IN ('arxiv', 'upload', 'external')),
	CONSTRAINT "pdf_source_arxiv_check" CHECK ("articles"."pdf_source" != 'arxiv' OR "articles"."arxiv_id" IS NOT NULL),
	CONSTRAINT "pdf_source_upload_check" CHECK ("articles"."pdf_source" != 'upload' OR "articles"."pdf_url" IS NOT NULL),
	CONSTRAINT "pdf_source_external_check" CHECK ("articles"."pdf_source" != 'external' OR "articles"."pdf_url" IS NOT NULL),
	CONSTRAINT "published_year_check" CHECK ("articles"."published_year" IS NULL OR ("articles"."published_year" >= 1900 AND "articles"."published_year" <= 2100)),
	CONSTRAINT "published_month_check" CHECK ("articles"."published_month" IS NULL OR ("articles"."published_month" >= 1 AND "articles"."published_month" <= 12)),
	CONSTRAINT "published_day_check" CHECK ("articles"."published_day" IS NULL OR ("articles"."published_day" >= 1 AND "articles"."published_day" <= 31))
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"open_alex_id" text,
	"orcid" text,
	"affiliation" text,
	"homepage" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "authors_open_alex_id_unique" UNIQUE("open_alex_id"),
	CONSTRAINT "authors_orcid_unique" UNIQUE("orcid")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	CONSTRAINT "tag_type_check" CHECK ("tags"."type" IN ('keyword', 'arxiv_subject', 'msc_code'))
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "articles_author_ids_gin_idx" ON "articles" USING gin ("author_ids");--> statement-breakpoint
CREATE INDEX "articles_tag_ids_gin_idx" ON "articles" USING gin ("tag_ids");