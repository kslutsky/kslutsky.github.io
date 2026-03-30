import type { InferSelectModel } from "drizzle-orm";
import type { articles, authors } from "@/lib/db/schema";
import { renderMath } from "@/lib/render-math";
import { generateBibtex } from "@/lib/bibtex";
import { AbstractToggle } from "./abstract-toggle";
import { BibtexButton } from "./bibtex-button";
import { ErratumBadge } from "./erratum-badge";
import { ExternalLink, FileText, Link2 } from "lucide-react";

type Article = InferSelectModel<typeof articles>;
type Author = InferSelectModel<typeof authors>;
type Erratum = InferSelectModel<typeof articles>;

interface ArticleCardProps {
  article: Article;
  authorNames: string[];
  authors?: { name: string; homepage: string | null }[];
  errata: Erratum[];
  showDraftBadge?: boolean;
  disambiguationSuffix?: string;
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

  if (article.type === "preprint") {
    if (article.journalName) {
      return `To appear in ${article.journalName}`;
    }
    return null;
  }

  return null;
}

function getPdfUrl(article: Article): string | null {
  let url: string | null = null;
  if (article.pdfSource === "arxiv" && article.arxivId) {
    url = `https://arxiv.org/pdf/${article.arxivId}`;
  } else if (
    (article.pdfSource === "upload" || article.pdfSource === "external") &&
    article.pdfUrl
  ) {
    url = article.pdfUrl;
  } else if (article.pdfUrl) {
    url = article.pdfUrl;
  }

  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("https://")) return url;
  return null;
}

const iconLinkClass =
  "inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 rounded-sm min-h-[44px] sm:min-h-0";

export async function ArticleCard({
  article,
  authorNames,
  authors,
  errata,
  showDraftBadge,
  disambiguationSuffix,
}: ArticleCardProps) {
  const publicationLine = buildPublicationLine(article);
  const pdfUrl = getPdfUrl(article);
  const renderedTitle = await renderMath(article.title);
  const renderedAbstract = article.abstract
    ? await renderMath(article.abstract)
    : null;

  const bibtex = generateBibtex(
    {
      type: article.type as "preprint" | "published" | "erratum",
      title: article.title,
      authors: authorNames,
      journalName: article.journalName,
      volume: article.volume,
      issue: article.issue,
      pages: article.pages,
      publishedYear: article.publishedYear,
      doi: article.doi,
      arxivId: article.arxivId,
      abstract: article.abstract,
      createdAtYear: new Date(article.createdAt).getFullYear(),
    },
    disambiguationSuffix
  );

  return (
    <article className="group">
      {/* Title */}
      <div className="flex items-start gap-2">
        <h3
          className="text-base font-semibold leading-snug text-[var(--text-primary)]"
          dangerouslySetInnerHTML={{ __html: renderedTitle }}
        />
        {showDraftBadge && article.status === "draft" && (
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            DRAFT
          </span>
        )}
      </div>

      {/* Authors */}
      {authorNames.length > 0 && (
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {(authors ?? authorNames.map((n) => ({ name: n, homepage: null }))).map((a, i) => (
            <span key={i}>
              {i > 0 && ", "}
              {a.homepage && (a.homepage.startsWith("https://") || a.homepage.startsWith("http://")) ? (
                <a
                  href={a.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  {a.name}
                </a>
              ) : (
                a.name
              )}
            </span>
          ))}
        </p>
      )}

      {/* Publication info */}
      {publicationLine && (
        <p className="mt-1 text-xs text-[var(--text-muted)] italic">
          {publicationLine}
        </p>
      )}

      {/* Action row: icons + abstract toggle */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {article.arxivId && (
          <a
            href={`https://arxiv.org/abs/${article.arxivId}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View on arXiv: ${article.title}`}
            className={iconLinkClass}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span>arXiv</span>
          </a>
        )}

        {article.doi && (
          <a
            href={`https://doi.org/${article.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View DOI record: ${article.title}`}
            className={iconLinkClass}
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>DOI</span>
          </a>
        )}

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Download PDF: ${article.title}`}
            className={iconLinkClass}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>PDF</span>
          </a>
        )}

        <BibtexButton bibtex={bibtex} title={article.title} />

        {renderedAbstract && (
          <AbstractToggle renderedHtml={renderedAbstract} id={article.id} />
        )}
      </div>

      {/* Errata */}
      {errata?.map(async (erratum) => {
        const renderedErratumAbstract = erratum.abstract
          ? await renderMath(erratum.abstract)
          : undefined;
        return (
          <ErratumBadge
            key={erratum.id}
            erratum={erratum}
            renderedAbstract={renderedErratumAbstract}
          />
        );
      })}
    </article>
  );
}
