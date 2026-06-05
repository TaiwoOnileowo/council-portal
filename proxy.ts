import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

type PublicRoute = {
  // Matches the request pathname.
  pattern: RegExp;
  // Human-readable note on why this route bypasses the session gate.
  description: string;
  // Optional gate: runs only when a route needs a session-aware decision.
  // Return a path to redirect to, or null/undefined to let the request through.
  resolve?: (session: Session | null) => string | null | undefined;
};

const PUBLIC_ROUTES: PublicRoute[] = [
  {
    pattern: /^\/api\/auth(\/.*)?$/,
    description: "NextAuth internals — always allowed",
  },
  {
    pattern: /^\/api\/webhook(\/.*)?$/,
    description:
      "Inbound webhooks (e.g. flutterwave) — auth handled in handler",
  },
  {
    pattern: /^\/api\/uploadthing(\/.*)?$/,
    description: "UploadThing upload endpoint — auth handled in handler",
  },
  {
    pattern: /^\/new-keys(\/.*)?$/,
    description: "Password reset — user is unauthenticated by definition",
  },
  {
    pattern: /^\/gate(\/.*)?$/,
    description: "Login gate — bounce authenticated non-vendors home",
    resolve: (session) =>
      session && session.user.role !== "VENDOR" ? "/" : null,
  },
  {
    pattern: /^\/vendor-gate(\/.*)?$/,
    description:
      "Vendor login gate — bounce authenticated vendors to dashboard",
    resolve: (session) =>
      session && session.user.role === "VENDOR" ? "/vendor-dashboard" : null,
  },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicRoute = PUBLIC_ROUTES.find((route) =>
    route.pattern.test(pathname),
  );

  if (publicRoute) {
    if (!publicRoute.resolve) {
      return NextResponse.next();
    }
    const redirectTo = publicRoute.resolve(await auth());
    return redirectTo
      ? NextResponse.redirect(new URL(redirectTo, req.url))
      : NextResponse.next();
  }

  // Every other route requires a session
  const session = await auth();

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/gate", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webop|ico|css|js|woff2?|ttf)).*)",
  ],
};
