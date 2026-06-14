import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PUBLIC_ROUTES } from "@/lib/proxy.constant";

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)).*)",
  ],
};
