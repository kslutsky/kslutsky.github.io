import { getArticle, getErrata } from "@/lib/actions/articles";
import { getAuthors } from "@/lib/actions/authors";
import { ArticleForm } from "@/components/admin/article-form";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();
  const allAuthors = await getAuthors();
  const errata = await getErrata(id);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">
        Edit Article
      </h1>
      <ArticleForm article={article} authors={allAuthors} />
      {article.type !== "erratum" && (
        <div className="mt-8 border-t border-stone-200 pt-6">
          <h2 className="text-lg font-semibold text-stone-900">Errata</h2>
          {errata.length === 0 && (
            <p className="mt-2 text-sm text-stone-500">No errata.</p>
          )}
          {errata.map((e) => (
            <div key={e.id} className="mt-2 text-sm">
              <Link
                href={`/admin/articles/${e.id}`}
                className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
              >
                {e.title}
              </Link>
            </div>
          ))}
          <Link
            href={`/admin/articles/new?parentId=${article.id}`}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-stone-800 text-white shadow-sm hover:bg-stone-700 transition-colors duration-150"
          >
            + Add Erratum
          </Link>
        </div>
      )}
    </div>
  );
}
