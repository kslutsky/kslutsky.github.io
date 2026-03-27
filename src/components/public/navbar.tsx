"use client";

import Link from "next/link";
import { useTab } from "./tab-provider";

const researchLinks = [
  { href: "#preprints", label: "Preprints" },
  { href: "#publications", label: "Publications" },
  { href: "#lecture-notes", label: "Lecture Notes" },
];

const academicLinks = [
  { href: "#teaching", label: "Teaching" },
  { href: "#students", label: "Students" },
];

export function Navbar() {
  const { activeTab } = useTab();
  const links = activeTab === "academic" ? academicLinks : researchLinks;

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-40">
      <nav className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-widest text-stone-900"
        >
          Konstantin Slutsky
        </Link>
        <div className="hidden sm:flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
