export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export const ARTICLE_TYPES = ["preprint", "published", "erratum"] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export const ARTICLE_STATUSES = ["draft", "published"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const PDF_SOURCES = ["arxiv", "upload", "external"] as const;
export type PdfSource = (typeof PDF_SOURCES)[number];

export const TAG_TYPES = ["keyword", "arxiv_subject", "msc_code"] as const;
export type TagType = (typeof TAG_TYPES)[number];
