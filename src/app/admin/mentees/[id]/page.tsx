import { notFound } from "next/navigation";
import { getMentee } from "@/lib/actions/mentees";
import MenteeForm from "@/components/admin/mentee-form";

interface MenteeEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function MenteeEditPage({ params }: MenteeEditPageProps) {
  const { id } = await params;

  const mentee = await getMentee(id);
  if (!mentee) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Edit Mentee</h1>
      <div className="max-w-xl rounded-lg border border-stone-200 bg-white shadow-sm p-6">
        <MenteeForm mentee={mentee} />
      </div>
    </div>
  );
}
