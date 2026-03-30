"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            backgroundColor: "#ffffff",
            color: "#111111",
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "1.125rem", color: "#666666" }}>
            Something went wrong.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={unstable_retry}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.375rem",
                border: "1px solid #e5e5e5",
                backgroundColor: "#f5f5f5",
                color: "#111111",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.375rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
