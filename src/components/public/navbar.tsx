import Link from "next/link";

const navLinks = [
  { href: "#preprints", label: "Preprints" },
  { href: "#publications", label: "Publications" },
  { href: "#lecture-notes", label: "Notes" },
  { href: "#teaching", label: "Teaching" },
  { href: "#students", label: "Students" },
];

export function Navbar() {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-40">
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-indigo-600 text-white text-xs font-bold tracking-wide"
          aria-label="Konstantin Slutsky — Home"
        >
          KS
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-2 text-sm font-medium text-stone-400 hover:text-stone-700 transition-colors duration-150 whitespace-nowrap rounded-md hover:bg-stone-100"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
