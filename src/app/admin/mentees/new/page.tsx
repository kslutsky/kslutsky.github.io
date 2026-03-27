import MenteeForm from "@/components/admin/mentee-form";

export default function NewMenteePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">New Mentee</h1>
      <div className="max-w-xl rounded-lg border border-stone-200 bg-white shadow-sm p-6">
        <MenteeForm />
      </div>
    </div>
  );
}
