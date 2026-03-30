"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

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

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
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

        {/* Mobile: theme switcher + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeSwitcher />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-[var(--border)] bg-[var(--bg-navbar)]">
          <div className="px-4 py-2 space-y-1">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
