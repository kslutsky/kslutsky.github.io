import Link from "next/link";
import { getMentees } from "@/lib/actions/mentees";
import MenteeTable from "@/components/admin/mentee-table";

interface MenteesPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function MenteesPage({ searchParams }: MenteesPageProps) {
  const params = await searchParams;
  const isTrash = params.tab === "trash";

  const menteeList = await getMentees(isTrash);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Mentees</h1>
        <Link
          href="/admin/mentees/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150"
        >
          New Mentee
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-6 border-b border-stone-200 mb-6">
        <Link
          href="/admin/mentees"
          className={
            !isTrash
              ? "pb-2 text-sm border-b-2 border-indigo-500 text-stone-900 font-medium"
              : "pb-2 text-sm text-stone-500 hover:text-stone-700"
          }
        >
          Active
        </Link>
        <Link
          href="/admin/mentees?tab=trash"
          className={
            isTrash
              ? "pb-2 text-sm border-b-2 border-indigo-500 text-stone-900 font-medium"
              : "pb-2 text-sm text-stone-500 hover:text-stone-700"
          }
        >
          Trash
        </Link>
      </div>

      <MenteeTable mentees={menteeList} isTrash={isTrash} />
    </div>
  );
}
