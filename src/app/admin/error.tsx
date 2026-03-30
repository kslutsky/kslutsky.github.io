"use client";

import { signOut } from "next-auth/react";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "1.125rem", color: "var(--text-muted)" }}>
        Something went wrong.
      </p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            backgroundColor: "var(--accent)",
            color: "#ffffff",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            border: "none",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
