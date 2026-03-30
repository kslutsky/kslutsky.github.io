import { auth } from "@/lib/auth";

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/admin")) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    // Use pathname, not href, to keep callbackUrl relative and prevent open-redirect
    // attacks where a full URL could redirect to an external host after sign-in.
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
