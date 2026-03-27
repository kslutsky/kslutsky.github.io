"use client";

import { useEffect, useState } from "react";

export default function ViewportWarning() {
  const [tooSmall, setTooSmall] = useState(false);

  useEffect(() => {
    function check() {
      setTooSmall(window.innerWidth < 768);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!tooSmall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-8 text-center">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Screen too small
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          The admin panel requires a screen width of at least 768px. Please use a
          larger device or resize your browser window.
        </p>
      </div>
    </div>
  );
}
