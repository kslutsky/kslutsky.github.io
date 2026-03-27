"use client";

import { useState } from "react";
import { Clipboard, Check } from "lucide-react";

export function BibtexButton({ bibtex, title }: { bibtex: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={`Copy BibTeX citation for ${title}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded-sm min-h-[44px] sm:min-h-0"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Cite</span>
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Citation copied to clipboard" : ""}
      </span>
    </button>
  );
}
