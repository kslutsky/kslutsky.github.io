import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";

const navLinks = [
  { href: "/#preprints", label: "Preprints" },
  { href: "/#publications", label: "Publications" },
  { href: "/#lecture-notes", label: "Notes" },
  { href: "/#students", label: "Mentees" },
  { href: "/#teaching", label: "Teaching" },
];

export function Navbar() {
  return (
    <header className="bg-[var(--bg-navbar)]/95 backdrop-blur-sm border-b border-[var(--border)] sticky top-0 z-40">
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-[var(--logo-bg)] text-white text-xs font-bold tracking-wide"
          aria-label="Konstantin Slutsky — Home"
        >
          KS
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150 whitespace-nowrap rounded-md hover:bg-[var(--bg-secondary)]"
            >
              {label}
            </a>
          ))}
          <ThemeSwitcher />
        </div>
      </nav>
    </header>
  );
}
