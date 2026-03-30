export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export const ARTICLE_TYPES = ["preprint", "published", "erratum", "notes"] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const PDF_SOURCES = ["arxiv", "upload", "external"] as const;
export type PdfSource = (typeof PDF_SOURCES)[number];

export const TAG_TYPES = ["keyword", "arxiv_subject", "msc_code"] as const;
export type TagType = (typeof TAG_TYPES)[number];

export const SEMESTERS = ["Fall", "Spring", "Summer"] as const;
export type Semester = (typeof SEMESTERS)[number];

export const MENTEE_CATEGORIES = ["phd", "postdoc", "masters", "undergraduate"] as const;
export type MenteeCategory = (typeof MENTEE_CATEGORIES)[number];
