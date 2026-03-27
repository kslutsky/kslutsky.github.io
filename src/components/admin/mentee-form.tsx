"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMentee, updateMentee } from "@/lib/actions/mentees";
import ConfirmDialog from "@/components/admin/confirm-dialog";

type Mentee = {
  id: string;
  name: string;
  category: string;
  institution: string;
  startYear: number;
  endYear: number | null;
  thesisTitle: string | null;
  firstPosition: string | null;
  homepage: string | null;
  status: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface MenteeFormProps {
  mentee?: Mentee;
}

export default function MenteeForm({ mentee }: MenteeFormProps) {
  const router = useRouter();
  const isEdit = !!mentee;

  const [name, setName] = useState(mentee?.name ?? "");
  const [category, setCategory] = useState(mentee?.category ?? "phd");
  const [institution, setInstitution] = useState(mentee?.institution ?? "");
  const [startYear, setStartYear] = useState(
    mentee?.startYear?.toString() ?? ""
  );
  const [endYear, setEndYear] = useState(mentee?.endYear?.toString() ?? "");
  const [thesisTitle, setThesisTitle] = useState(mentee?.thesisTitle ?? "");
  const [firstPosition, setFirstPosition] = useState(
    mentee?.firstPosition ?? ""
  );
  const [homepage, setHomepage] = useState(mentee?.homepage ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const showThesisTitle = category === "phd" || category === "masters";

  async function handleSubmit(status: "draft" | "published") {
    setSaving(true);
    setError(null);

    const payload = {
      name,
      category: category as "phd" | "postdoc" | "masters" | "undergraduate",
      institution,
      startYear: parseInt(startYear, 10),
      endYear: endYear ? parseInt(endYear, 10) : undefined,
      thesisTitle: thesisTitle || undefined,
      firstPosition: firstPosition || undefined,
      homepage: homepage || undefined,
      status,
    };

    const result = isEdit
      ? await updateMentee(mentee.id, payload)
      : await createMentee(payload);

    if (result.success) {
      router.push("/admin/mentees");
      router.refresh();
    } else {
      setError(result.error);
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-150";

  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="mentee-name" className={labelClass}>
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="mentee-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="mentee-category" className={labelClass}>
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="mentee-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="phd">PhD</option>
          <option value="postdoc">Postdoc</option>
          <option value="masters">Master&apos;s</option>
          <option value="undergraduate">Undergraduate</option>
        </select>
      </div>

      {/* Institution */}
      <div>
        <label htmlFor="mentee-institution" className={labelClass}>
          Institution <span className="text-red-500">*</span>
        </label>
        <input
          id="mentee-institution"
          type="text"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      {/* Years */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="mentee-start-year" className={labelClass}>
            Start Year <span className="text-red-500">*</span>
          </label>
          <input
            id="mentee-start-year"
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            required
            min={1900}
            max={2100}
            placeholder="e.g. 2019"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="mentee-end-year" className={labelClass}>
            End Year
          </label>
          <input
            id="mentee-end-year"
            type="number"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            min={1900}
            max={2100}
            placeholder="Leave blank if current"
            className={inputClass}
          />
        </div>
      </div>

      {/* Thesis Title — only for PhD and Master's */}
      {showThesisTitle && (
        <div>
          <label htmlFor="mentee-thesis-title" className={labelClass}>
            Thesis Title
          </label>
          <input
            id="mentee-thesis-title"
            type="text"
            value={thesisTitle}
            onChange={(e) => setThesisTitle(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {/* First Position */}
      <div>
        <label htmlFor="mentee-first-position" className={labelClass}>
          First Position
        </label>
        <input
          id="mentee-first-position"
          type="text"
          value={firstPosition}
          onChange={(e) => setFirstPosition(e.target.value)}
          placeholder="e.g. Assistant Professor at MIT"
          className={inputClass}
        />
      </div>

      {/* Homepage */}
      <div>
        <label htmlFor="mentee-homepage" className={labelClass}>
          Homepage
        </label>
        <input
          id="mentee-homepage"
          type="text"
          value={homepage}
          onChange={(e) => setHomepage(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSubmit("draft")}
          disabled={saving || !name.trim() || !institution.trim() || !startYear}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-stone-700 border border-stone-300 shadow-sm hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save as Draft"}
        </button>
        <button
          type="button"
          onClick={() => setShowPublishConfirm(true)}
          disabled={saving || !name.trim() || !institution.trim() || !startYear}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Publish
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/mentees")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors duration-150"
        >
          Cancel
        </button>
      </div>

      {/* Publish confirmation dialog */}
      {showPublishConfirm && (
        <ConfirmDialog
          title="Publish Mentee"
          message="Are you sure you want to publish this mentee? They will be publicly visible."
          confirmLabel="Publish"
          onConfirm={() => {
            setShowPublishConfirm(false);
            handleSubmit("published");
          }}
          onCancel={() => setShowPublishConfirm(false)}
        />
      )}
    </div>
  );
}
