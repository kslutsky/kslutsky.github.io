"use client";

import { useState } from "react";

export function BibtexButton({ bibtex }: { bibtex: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      className="relative text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded-sm"
    >
      {copied ? "Copied!" : "BibTeX"}
    </button>
  );
}
