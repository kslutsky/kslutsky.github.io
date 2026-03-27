import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_GITHUB_USERNAME;
      if (!allowed) return false;
      const login = (profile as { login?: string } | undefined)?.login;
      return login?.toLowerCase() === allowed.toLowerCase();
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}
