import { notFound } from "next/navigation";
import { getAuthor } from "@/lib/actions/authors";
import AuthorForm from "@/components/admin/author-form";

interface AuthorEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuthorEditPage({ params }: AuthorEditPageProps) {
  const { id } = await params;

  if (id === "new") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900 mb-6">New Author</h1>
        <div className="max-w-xl rounded-lg border border-stone-200 bg-white shadow-sm p-6">
          <AuthorForm />
        </div>
      </div>
    );
  }

  const author = await getAuthor(id);
  if (!author) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Edit Author</h1>
      <div className="max-w-xl rounded-lg border border-stone-200 bg-white shadow-sm p-6">
        <AuthorForm author={author} />
      </div>
    </div>
  );
}
