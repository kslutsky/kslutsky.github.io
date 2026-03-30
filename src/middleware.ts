import { auth } from "@/lib/auth";

export default auth((req) => {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const allowed = process.env.ALLOWED_GITHUB_USERNAME;

    if (!req.auth) {
      // Not signed in — redirect to sign-in
      const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
      // Use pathname, not href, to keep callbackUrl relative and prevent open-redirect
      // attacks where a full URL could redirect to an external host after sign-in.
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return Response.redirect(signInUrl);
    }

    // Defense-in-depth: the signIn callback in auth.ts already rejects wrong-account
    // users (they never get a session). This check guards against edge cases like
    // a stale session from before the login field was added to the JWT, or if the
    // signIn callback is ever removed. Redirect to signout (not signin) to avoid
    // an infinite redirect loop.
    const login = (req.auth.user as { login?: string } | undefined)?.login;
    if (!allowed || login?.toLowerCase() !== allowed.toLowerCase()) {
      const signOutUrl = new URL("/api/auth/signout", req.nextUrl.origin);
      return Response.redirect(signOutUrl);
    }
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
