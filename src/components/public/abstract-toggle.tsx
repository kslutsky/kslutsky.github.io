"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

export function AbstractToggle({
  renderedHtml,
  id,
}: {
  renderedHtml: string;
  id: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`abstract-${id}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 min-h-[44px] sm:min-h-0"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
        {expanded ? "Hide" : "Abstract"}
      </button>
      <div
        id={`abstract-${id}`}
        className={`basis-full overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[48rem] opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <div
          className="max-w-prose text-sm text-[var(--text-secondary)] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </>
  );
}
