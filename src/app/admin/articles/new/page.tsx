import { ArticleForm } from "@/components/admin/article-form";
import { getAuthors } from "@/lib/actions/authors";
import { getArticle } from "@/lib/actions/articles";

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ parentId?: string }>;
}) {
  const { parentId } = await searchParams;
  const allAuthors = await getAuthors();
  const parent = parentId ? await getArticle(parentId) : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">
        {parent ? `Add Erratum to "${parent.title}"` : "New Article"}
      </h1>
      <ArticleForm authors={allAuthors} parent={parent} />
    </div>
  );
}
