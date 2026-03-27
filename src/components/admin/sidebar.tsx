"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navGroups = [
  {
    label: "Content",
    items: [
      { label: "Articles", href: "/admin/articles" },
      { label: "Authors", href: "/admin/authors" },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Courses", href: "/admin/courses" },
      { label: "Mentees", href: "/admin/mentees" },
    ],
  },
  {
    label: null,
    items: [
      { label: "Preview", href: "/admin/preview" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-zinc-900 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="text-sm font-semibold text-white">Site</div>
        <div className="text-xs text-zinc-500 mt-0.5">Admin</div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.label !== null && (
              <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 px-3 pt-6 pb-2 first:pt-3">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
