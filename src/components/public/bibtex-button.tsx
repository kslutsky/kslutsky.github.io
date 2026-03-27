"use client";

export function BibtexButton({ bibtex }: { bibtex: string }) {
  function handleClick() {
    const blob = new Blob([bibtex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "citation.bib";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded-sm"
    >
      BibTeX
    </button>
  );
}
