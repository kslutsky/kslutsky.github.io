"use client";

import { useState } from "react";

export function AbstractToggle({
  renderedHtml,
  id,
}: {
  renderedHtml: string;
  id: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`abstract-${id}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600
                   hover:text-indigo-800 transition-colors rounded-sm mt-3
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-indigo-600 focus-visible:ring-offset-1"
      >
        <span
          className={`inline-block transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          &#9656;
        </span>
        {expanded ? "Hide abstract" : "Abstract"}
      </button>
      <div
        id={`abstract-${id}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[48rem] opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <div
          className="max-w-prose text-sm text-stone-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
}
