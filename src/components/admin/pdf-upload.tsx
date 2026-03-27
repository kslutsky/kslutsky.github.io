"use client";

import { useRef, useState } from "react";
import { uploadPdf, deletePdf } from "@/lib/actions/upload";

interface PdfUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export default function PdfUpload({ value, onChange }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadPdf(formData);

    if (result.success) {
      onChange(result.data.url);
    } else {
      setError(result.error);
    }

    setUploading(false);
    // Reset input so the same file can be re-selected if needed
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete() {
    if (!value) return;
    setUploading(true);
    setError(null);

    const result = await deletePdf(value);

    if (result.success) {
      onChange("");
    } else {
      setError(result.error);
    }

    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : value ? "Replace PDF" : "Choose PDF"}
        </button>

        {value && !uploading && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>

      {value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
        >
          View current PDF
        </a>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
