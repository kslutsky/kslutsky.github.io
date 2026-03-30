"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function ForceSignOut() {
  useEffect(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-muted)",
        fontFamily: "var(--font-sans)",
        fontSize: "0.875rem",
      }}
    >
      Signing out...
    </div>
  );
}
