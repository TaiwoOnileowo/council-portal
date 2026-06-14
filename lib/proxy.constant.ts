import type { Session } from "next-auth";

export type PublicRoute = {
  pattern: RegExp;
  description: string;
  resolve?: (session: Session | null) => string | null | undefined;
};

function resolveGateRedirect(
  session: Session | null,
  gate: "student" | "vendor" | "admin",
): string | null {
  if (!session) return null;
  const { isAdmin, role } = session.user;

  if (gate === "student") {
    if (role === "VENDOR") return "/vendor-dashboard";
    return "/";
  }
  if (gate === "vendor") {
    if (role === "VENDOR") return "/vendor-dashboard";
    if (isAdmin) return "/admin";
    return "/";
  }
  if (isAdmin) return "/admin";
  if (role === "VENDOR") return "/vendor-dashboard";
  return "/";
}

export const PUBLIC_ROUTES: PublicRoute[] = [
  {
    pattern: /^\/api\/auth(\/.*)?$/,
    description: "NextAuth internals — always allowed",
  },
  {
    pattern: /^\/api\/webhook(\/.*)?$/,
    description: "Inbound webhooks (e.g. flutterwave) — auth handled in handler",
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
    description: "Student login gate — redirect authenticated users to their portal",
    resolve: (session) => resolveGateRedirect(session, "student"),
  },
  {
    pattern: /^\/vendor-gate(\/.*)?$/,
    description: "Vendor login gate — redirect authenticated users to their portal",
    resolve: (session) => resolveGateRedirect(session, "vendor"),
  },
  {
    pattern: /^\/admin-gate(\/.*)?$/,
    description: "Admin login gate — redirect authenticated users to their portal",
    resolve: (session) => resolveGateRedirect(session, "admin"),
  },
];
