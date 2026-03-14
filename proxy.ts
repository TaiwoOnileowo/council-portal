import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const unprotectedPaths = [
  /^\/gate(\/.*)?$/,
  /^\/api\/auth(\/.*)?$/,
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isUnprotected = unprotectedPaths.some((pattern) =>
    pattern.test(pathname)
  );

  if (isUnprotected) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const redirectUrl = new URL("/gate", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)).*)",
  ],
};
