import type { InferSelectModel } from "drizzle-orm";
import type { articles, authors } from "@/lib/db/schema";
import { renderMath } from "@/lib/render-math";
import { AbstractToggle } from "./abstract-toggle";

type Article = InferSelectModel<typeof articles>;
type Author = InferSelectModel<typeof authors>;
type Erratum = InferSelectModel<typeof articles>;

interface ArticleCardProps {
  article: Article;
  authorNames: string[];
  errata: Erratum[];
  showDraftBadge?: boolean;
}

function buildPublicationLine(article: Article): string | null {
  if (article.type === "published" && article.journalName) {
    const parts: string[] = [article.journalName];
    if (article.volume) parts.push(`Vol ${article.volume}`);
    if (article.issue) parts.push(`Issue ${article.issue}`);
    if (article.publishedYear) parts.push(`(${article.publishedYear})`);
    if (article.pages) parts.push(article.pages);
    return parts.join(", ");
  }

  if (article.type === "preprint" && article.arxivId) {
    const versionSuffix =
      article.arxivVersion != null ? ` v${article.arxivVersion}` : "";
    return `Preprint, arXiv:${article.arxivId}${versionSuffix}`;
  }

  return null;
}

function getPdfUrl(article: Article): string | null {
  if (article.pdfSource === "arxiv" && article.arxivId) {
    return `https://arxiv.org/pdf/${article.arxivId}`;
  }
  if (
    (article.pdfSource === "upload" || article.pdfSource === "external") &&
    article.pdfUrl
  ) {
    return article.pdfUrl;
  }
  return null;
}

const linkClassName =
  "text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded-sm";

export async function ArticleCard({
  article,
  authorNames,
  errata,
  showDraftBadge,
}: ArticleCardProps) {
  const publicationLine = buildPublicationLine(article);
  const pdfUrl = getPdfUrl(article);
  const renderedTitle = await renderMath(article.title);
  const renderedAbstract = article.abstract
    ? await renderMath(article.abstract)
    : null;

  const links: { label: string; href: string }[] = [];

  if (article.arxivId) {
    links.push({
      label: "arXiv",
      href: `https://arxiv.org/abs/${article.arxivId}`,
    });
  }

  if (article.doi) {
    links.push({
      label: "DOI",
      href: `https://doi.org/${article.doi}`,
    });
  }

  if (pdfUrl) {
    links.push({
      label: "PDF",
      href: pdfUrl,
    });
  }

  return (
    <article className="group">
      <div className="flex items-center gap-2">
        <h3
          className="text-base font-semibold leading-snug text-stone-900"
          dangerouslySetInnerHTML={{ __html: renderedTitle }}
        />
        {showDraftBadge && article.status === "draft" && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            DRAFT
          </span>
        )}
      </div>

      {authorNames.length > 0 && (
        <p className="mt-1 text-sm text-stone-500">
          {authorNames.join(", ")}
        </p>
      )}

      {publicationLine && (
        <p className="mt-0.5 text-sm text-stone-400 italic">
          {publicationLine}
        </p>
      )}

      {links.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {links.map((link, i) => (
            <span key={link.label} className="inline-flex items-center gap-x-3">
              {i > 0 && (
                <span className="text-stone-300" aria-hidden="true">
                  &middot;
                </span>
              )}
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                {link.label}
              </a>
            </span>
          ))}
        </div>
      )}

      {renderedAbstract && (
        <AbstractToggle renderedHtml={renderedAbstract} id={article.id} />
      )}
    </article>
  );
}
