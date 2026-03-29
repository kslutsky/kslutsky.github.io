"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "system" | "light" | "dark";

function getResolvedTheme(): "light" | "dark" {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    }
    setResolved(getResolvedTheme());

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(getResolvedTheme());
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  function cycle() {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);

    if (next === "system") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    }

    setResolved(getResolvedTheme());
  }

  const Icon = theme === "system" ? Monitor : resolved === "dark" ? Sun : Moon;

  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to change.`}
      className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-150"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
