import Link from "next/link";
import { getAuthors } from "@/lib/actions/authors";
import { getArticles } from "@/lib/actions/articles";
import AuthorTable from "@/components/admin/author-table";

export default async function AuthorsPage() {
  const [authors, allArticles] = await Promise.all([
    getAuthors(),
    getArticles(),
  ]);

  // Compute article counts per author
  const articleCounts: Record<string, number> = {};
  for (const article of allArticles) {
    for (const authorId of article.authorIds) {
      articleCounts[authorId] = (articleCounts[authorId] ?? 0) + 1;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Authors</h1>
        <Link
          href="/admin/authors/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150"
        >
          New Author
        </Link>
      </div>

      <AuthorTable authors={authors} articleCounts={articleCounts} />
    </div>
  );
}
