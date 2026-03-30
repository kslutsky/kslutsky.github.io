"use client";

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

  return (
    <aside className="w-56 shrink-0 bg-zinc-900 flex flex-col h-screen sticky top-0">
      <Link href="/" className="block px-4 py-5 border-b border-zinc-800 hover:bg-zinc-800 transition-colors duration-150">
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
  );
}
