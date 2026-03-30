import { handlers, auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const GET = handlers.GET;

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") ?? null;

  const response = await handlers.POST(request);

  // Log login if this was a callback (sign-in completion)
  const url = new URL(request.url);
  if (url.pathname.includes("/callback/")) {
    try {
      const session = await auth();
      const login = (session?.user as { login?: string } | undefined)?.login;
      if (login) {
        await logAudit({
          action: "login",
          userLogin: login,
          ipAddress: ip,
        }).catch((err) => console.error("[audit:login]", err));
      }
    } catch {
      // Auth check after callback may fail — ignore silently
    }
  }

  return response;
}
