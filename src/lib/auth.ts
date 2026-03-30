import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  events: {
    async signIn({ user, profile }) {
      const login = (profile as { login?: string } | undefined)?.login ?? user?.email ?? "unknown";
      try {
        // Dynamic import to avoid circular dependency
        const { logAudit } = await import("@/lib/audit");
        await logAudit({
          action: "login",
          userLogin: login,
        });
      } catch (err) {
        console.error("[audit:login]", err);
      }
    },
  },
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_GITHUB_USERNAME;
      if (!allowed) return false;
      return (profile as { login?: string } | undefined)?.login?.toLowerCase() === allowed.toLowerCase();
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.login = (profile as { login?: string }).login;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.login) {
        (session.user as unknown as Record<string, unknown>).login = token.login;
      }
      return session;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  const allowed = process.env.ALLOWED_GITHUB_USERNAME;
  if (!session || !allowed) throw new Error("Unauthorized");
  const login = (session?.user as { login?: string } | undefined)?.login;
  if (!login || login.toLowerCase() !== allowed.toLowerCase()) {
    throw new Error("Unauthorized");
  }
  return session;
}
