import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow NextAuth internals through
  if (/^\/api\/auth(\/.*)?$/.test(pathname)) {
    return NextResponse.next();
  }

  // Gate: let unauthenticated users in, bounce authenticated users home
  if (/^\/gate(\/.*)?$/.test(pathname)) {
    const session = await auth();
    if (session && !session.user.isVendor) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Vendor gate: same as /gate — unauthenticated users in, authenticated users bounce home
  if (/^\/vendor-gate(\/.*)?$/.test(pathname)) {
    const session = await auth();
    if (session && session.user.isVendor) {
      return NextResponse.redirect(new URL("/vendor-dashboard", req.url));
    }
    return NextResponse.next();
  }

  // New-keys (password reset): always public — user is unauthenticated by definition
  if (/^\/new-keys(\/.*)?$/.test(pathname)) {
    return NextResponse.next();
  }

  // UploadThing: public upload endpoint (auth handled inside the route handler)
  if (/^\/api\/uploadthing(\/.*)?$/.test(pathname)) {
    return NextResponse.next();
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
