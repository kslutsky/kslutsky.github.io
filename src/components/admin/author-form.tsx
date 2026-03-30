"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAuthor, updateAuthor } from "@/lib/actions/authors";
import { fetchAuthorMetadata } from "@/lib/actions/fetch-metadata";

type Author = {
  id: string;
  name: string;
  openAlexId: string | null;
  orcid: string | null;
  affiliation: string | null;
  homepage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface AuthorFormProps {
  author?: Author;
}

export default function AuthorForm({ author }: AuthorFormProps) {
  const router = useRouter();
  const isEdit = !!author;

  const [fetchQuery, setFetchQuery] = useState("");
  const [fetching, setFetching] = useState(false);

  const [name, setName] = useState(author?.name ?? "");
  const [orcid, setOrcid] = useState(author?.orcid ?? "");
  const [openAlexId, setOpenAlexId] = useState(author?.openAlexId ?? "");
  const [affiliation, setAffiliation] = useState(author?.affiliation ?? "");
  const [homepage, setHomepage] = useState(author?.homepage ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    if (!fetchQuery.trim()) return;
    setFetching(true);
    setError(null);

    const result = await fetchAuthorMetadata(fetchQuery.trim());

    if (result.success) {
      const data = result.data;
      setName(data.name);
      if (data.openAlexId) setOpenAlexId(data.openAlexId);
      if (data.orcid) setOrcid(data.orcid);
      if (data.affiliation) setAffiliation(data.affiliation);
    } else {
      setError(result.error);
    }
    setFetching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      openAlexId: openAlexId || undefined,
      orcid: orcid || undefined,
      affiliation: affiliation || undefined,
      homepage: homepage || undefined,
    };

    const result = isEdit
      ? await updateAuthor(author.id, payload)
      : await createAuthor(payload);

    if (result.success) {
      router.push("/admin/authors");
      router.refresh();
    } else {
      setError(result.error);
    }
    setSaving(false);
  }

  const inputClass =
    "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-150";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Fetch from OpenAlex */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Fetch from OpenAlex
        </label>
        <div className="flex">
          <input
            type="text"
            value={fetchQuery}
            onChange={(e) => setFetchQuery(e.target.value)}
            placeholder="OpenAlex ID, ORCID, or name"
            className="flex-1 rounded-l-md border border-r-0 border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors duration-150"
          />
          <button
            type="button"
            onClick={handleFetch}
            disabled={fetching || !fetchQuery.trim()}
            className="inline-flex items-center gap-2 rounded-r-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {fetching ? "Fetching..." : "Fetch"}
          </button>
        </div>
      </div>

      <hr className="border-stone-200" />

      {/* Name */}
      <div>
        <label
          htmlFor="author-name"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="author-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      {/* ORCID */}
      <div>
        <label
          htmlFor="author-orcid"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          ORCID
        </label>
        <input
          id="author-orcid"
          type="text"
          value={orcid}
          onChange={(e) => setOrcid(e.target.value)}
          placeholder="0000-0000-0000-0000"
          className={inputClass}
        />
      </div>

      {/* OpenAlex ID */}
      <div>
        <label
          htmlFor="author-openalex"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          OpenAlex ID
        </label>
        <input
          id="author-openalex"
          type="text"
          value={openAlexId}
          onChange={(e) => setOpenAlexId(e.target.value)}
          placeholder="A1234567890"
          className={inputClass}
        />
      </div>

      {/* Affiliation */}
      <div>
        <label
          htmlFor="author-affiliation"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Affiliation
        </label>
        <input
          id="author-affiliation"
          type="text"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Homepage */}
      <div>
        <label
          htmlFor="author-homepage"
          className="block text-sm font-medium text-stone-700 mb-1"
        >
          Homepage
        </label>
        <input
          id="author-homepage"
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
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : isEdit ? "Update Author" : "Create Author"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/authors")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-stone-700 border border-stone-300 shadow-sm hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 transition-colors duration-150"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
