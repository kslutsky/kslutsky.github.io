"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "Articles", href: "/admin/articles" },
  { label: "Authors", href: "/admin/authors" },
  { label: "Courses", href: "/admin/courses" },
  { label: "Mentees", href: "/admin/mentees" },
  { label: "Settings", href: "/admin/settings" },
  { label: "Preview", href: "/admin/preview" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-40 md:hidden rounded-md bg-zinc-900 p-2 text-white shadow-lg"
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-zinc-900 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:shrink-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link
          href="/"
          className="block px-4 py-5 border-b border-zinc-800 hover:bg-zinc-800 transition-colors duration-150"
          onClick={() => setOpen(false)}
        >
          <div className="text-sm font-semibold text-white">Site</div>
          <div className="text-xs text-zinc-500 mt-0.5">Admin</div>
        </Link>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-zinc-800">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors duration-150 w-full"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
