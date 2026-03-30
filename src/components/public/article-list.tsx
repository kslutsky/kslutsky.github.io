import type { InferSelectModel } from "drizzle-orm";
import type { articles, authors } from "@/lib/db/schema";
import { buildDisambiguationMap } from "@/lib/bibtex";
import { ArticleCard } from "./article-card";

type Article = InferSelectModel<typeof articles>;
type Author = InferSelectModel<typeof authors>;

interface ArticleListProps {
  articles: Article[];
  authorMap: Map<string, Author>;
  errataByParent: Map<string, Article[]>;
  showDraftBadge?: boolean;
}

function groupByYear(items: Article[]): [number | null, Article[]][] {
  const groups = new Map<number | null, Article[]>();
  for (const article of items) {
    const year = article.publishedYear ?? null;
    const group = groups.get(year);
    if (group) {
      group.push(article);
    } else {
      groups.set(year, [article]);
    }
  }

  // Sort groups: numeric years descending, null (no year) last
  const entries = Array.from(groups.entries());
  entries.sort(([a], [b]) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return b - a;
  });

  return entries;
}

function resolveAuthorNames(
  article: Article,
  authorMap: Map<string, Author>
): string[] {
  return article.authorIds
    .map((id) => authorMap.get(id)?.name)
    .filter((name): name is string => name != null);
}

export function ArticleList({
  articles: articleList,
  authorMap,
  errataByParent,
  showDraftBadge,
}: ArticleListProps) {
  if (articleList.length === 0) {
    return (
      <p className="mt-6 text-sm text-[var(--text-secondary)]">No articles published yet.</p>
    );
  }

  const disambiguationMap = buildDisambiguationMap(
    articleList.map((a) => ({
      id: a.id,
      type: a.type,
      authors: resolveAuthorNames(a, authorMap),
      publishedYear: a.publishedYear,
      createdAtYear: new Date(a.createdAt).getFullYear(),
    }))
  );

  const yearGroups = groupByYear(articleList);

  return (
    <div className="mt-8 flex flex-col gap-6">
      {yearGroups.map(([year, groupArticles], groupIndex) => (
        <div key={year ?? "no-year"}>
          {/* Mobile: stacked layout */}
          <div className="sm:hidden">
            <h3 className="text-base font-semibold tabular-nums text-[var(--text-muted)] mb-4">
              {year ?? ""}
            </h3>
            <div className="flex flex-col gap-5">
              {groupArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  authorNames={resolveAuthorNames(article, authorMap)}
                  errata={errataByParent.get(article.id) ?? []}
                  showDraftBadge={showDraftBadge}
                  disambiguationSuffix={disambiguationMap.get(article.id)}
                />
              ))}
            </div>
          </div>

          {/* Desktop: year-anchored two-column layout */}
          <div
            className={`hidden sm:flex items-baseline gap-8 md:gap-12 ${
              groupIndex === 0
                ? ""
                : "pt-6 border-t border-[var(--border)]"
            }`}
          >
            <div className="w-12 shrink-0">
              <span className="text-base font-semibold tabular-nums text-[var(--text-muted)]">
                {year ?? ""}
              </span>
            </div>
            <div className="flex flex-col gap-8 flex-1 min-w-0">
              {groupArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  authorNames={resolveAuthorNames(article, authorMap)}
                  errata={errataByParent.get(article.id) ?? []}
                  showDraftBadge={showDraftBadge}
                  disambiguationSuffix={disambiguationMap.get(article.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
