import type { InferSelectModel } from "drizzle-orm";
import type { mentees } from "@/lib/db/schema";

type Mentee = InferSelectModel<typeof mentees>;

const CATEGORY_LABELS: Record<string, string> = {
  phd: "PhD Students",
  postdoc: "Postdocs",
  masters: "Master\u2019s Students",
  undergraduate: "Undergraduate Research",
};

const CATEGORY_ORDER = ["phd", "postdoc", "masters", "undergraduate"];

function formatYearRange(startYear: number, endYear: number | null): string {
  if (endYear === null) return `${startYear}\u2013`;
  if (startYear === endYear) return `${startYear}`;
  const endShort =
    Math.floor(startYear / 100) === Math.floor(endYear / 100)
      ? String(endYear).slice(2)
      : String(endYear);
  return `${startYear}\u2013${endShort}`;
}

export function MenteeList({ mentees }: { mentees: Mentee[] }) {
  if (mentees.length === 0) {
    return <p className="mt-6 text-sm text-[var(--text-secondary)]">No students listed yet.</p>;
  }

  const groups = new Map<string, Mentee[]>();
  for (const m of mentees) {
    const group = groups.get(m.category);
    if (group) group.push(m);
    else groups.set(m.category, [m]);
  }

  return (
    <div className="flex flex-col gap-8">
      {CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((cat, catIndex) => (
        <div
          key={cat}
          className={catIndex === 0 ? "" : "pt-6 border-t border-[var(--border)]"}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2 mb-4">
            {CATEGORY_LABELS[cat]}
          </h3>

          <div className="flex flex-col gap-6">
            {groups.get(cat)!.map((m) => (
              <div key={m.id}>
                {/* Mobile: stacked */}
                <div className="sm:hidden">
                  <p className="text-sm font-semibold tabular-nums text-[var(--text-muted)] mb-1">
                    {formatYearRange(m.startYear, m.endYear)}
                  </p>
                  {m.homepage ? (
                    <a
                      href={m.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold leading-snug text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 decoration-[var(--accent-border)] hover:decoration-[var(--accent)] transition-colors"
                    >
                      {m.name}
                    </a>
                  ) : (
                    <p className="text-base font-semibold leading-snug text-[var(--text-primary)]">{m.name}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--text-muted)] italic">{m.institution}</p>
                  {m.thesisTitle && (
                    <p className="mt-1 text-xs text-[var(--text-muted)] italic">
                      Thesis: &ldquo;{m.thesisTitle}&rdquo;
                    </p>
                  )}
                  {m.firstPosition && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Now: {m.firstPosition}
                    </p>
                  )}
                </div>

                {/* Desktop: year-range left column */}
                <div className="hidden sm:flex items-baseline gap-8 md:gap-12">
                  <div className="w-12 shrink-0">
                    <span className="text-base font-semibold tabular-nums text-[var(--text-muted)] whitespace-nowrap">
                      {formatYearRange(m.startYear, m.endYear)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {m.homepage ? (
                      <a
                        href={m.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-semibold leading-snug text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-2 decoration-[var(--accent-border)] hover:decoration-[var(--accent)] transition-colors"
                      >
                        {m.name}
                      </a>
                    ) : (
                      <p className="text-base font-semibold leading-snug text-[var(--text-primary)]">{m.name}</p>
                    )}
                    <p className="mt-1 text-xs text-[var(--text-muted)] italic">{m.institution}</p>
                    {m.thesisTitle && (
                      <p className="mt-1 text-xs text-[var(--text-muted)] italic">
                        Thesis: &ldquo;{m.thesisTitle}&rdquo;
                      </p>
                    )}
                    {m.firstPosition && (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Now: {m.firstPosition}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
