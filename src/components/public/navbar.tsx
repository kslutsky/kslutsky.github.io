import Link from "next/link";

export function Navbar() {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-40">
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-widest text-stone-900"
        >
          Konstantin Slutsky
        </Link>
        <div className="flex items-center gap-6">
          <a
            href="#publications"
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors duration-150"
          >
            Publications
          </a>
          <a
            href="#lecture-notes"
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors duration-150"
          >
            Lecture Notes
          </a>
        </div>
      </nav>
    </header>
  );
}
