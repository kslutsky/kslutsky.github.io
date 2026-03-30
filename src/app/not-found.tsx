import Link from "next/link";

export default function NotFound() {
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
      <p style={{ fontSize: "4rem", fontWeight: 700, lineHeight: 1, color: "var(--text-muted)" }}>
        404
      </p>
      <p style={{ fontSize: "1.125rem", color: "var(--text-muted)" }}>
        Page not found.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "0.5rem",
          padding: "0.5rem 1.25rem",
          borderRadius: "0.375rem",
          backgroundColor: "var(--accent)",
          color: "#ffffff",
          fontSize: "0.875rem",
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        Go home
      </Link>
    </div>
  );
}
