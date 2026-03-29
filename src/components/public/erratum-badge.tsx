import type { InferSelectModel } from "drizzle-orm";
import type { articles } from "@/lib/db/schema";
import { AbstractToggle } from "./abstract-toggle";

type Erratum = InferSelectModel<typeof articles>;

const linkClassName =
  "text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 decoration-[var(--accent-border)] hover:decoration-[var(--accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 rounded-sm";

interface ErratumBadgeProps {
  erratum: Erratum;
  renderedAbstract?: string;
}

function getPdfUrl(erratum: Erratum): string | null {
  if (erratum.pdfSource === "arxiv" && erratum.arxivId) {
    return `https://arxiv.org/pdf/${erratum.arxivId}`;
  }
  if (
    (erratum.pdfSource === "upload" || erratum.pdfSource === "external") &&
    erratum.pdfUrl
  ) {
    return erratum.pdfUrl;
  }
  return null;
}

export function ErratumBadge({ erratum, renderedAbstract }: ErratumBadgeProps) {
  const pdfUrl = getPdfUrl(erratum);

  const erratumLinks: { label: string; href: string }[] = [];
  if (pdfUrl) {
    erratumLinks.push({ label: "PDF", href: pdfUrl });
  }
  if (erratum.doi) {
    erratumLinks.push({ label: "DOI", href: `https://doi.org/${erratum.doi}` });
  }

  const dateStr =
    erratum.publishedYear != null
      ? [erratum.publishedYear, erratum.publishedMonth]
          .filter(Boolean)
          .join("/")
      : null;

  return (
    <div className="mt-3 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          Erratum
        </span>
        {dateStr && (
          <span className="text-xs text-[var(--text-muted)]">{dateStr}</span>
        )}
        {erratumLinks.map((link, i) => (
          <span key={link.label} className="inline-flex items-center gap-x-2">
            {(i > 0 || dateStr) && (
              <span className="text-[var(--text-muted)]" aria-hidden="true">
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
      {renderedAbstract && (
        <AbstractToggle renderedHtml={renderedAbstract} id={erratum.id} />
      )}
    </div>
  );
}
