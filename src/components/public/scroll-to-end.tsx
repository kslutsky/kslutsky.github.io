"use client";

import { useEffect, useRef } from "react";

export function ScrollToEnd({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollLeft = ref.current.scrollWidth;
    }
  }, []);

  return (
    <div
      ref={ref}
      className="overflow-x-auto"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>
  );
}
