import type { Session } from "next-auth";
import { SIDEBAR_CONFIG } from "./sidebar.constant";

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
  // Only redirect if scope already matches this gate — otherwise let them re-authenticate
  const scope = session.user.scope;
  if (scope === gate) return SIDEBAR_CONFIG[gate].home ?? "/";
  return null;
}

export const PUBLIC_ROUTES: PublicRoute[] = [
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
    pattern: /^\/api\/internal(\/.*)?$/,
    description:
      "Engineer-only internal APIs (e.g. settings) — secret-authenticated in handler, not session-based",
  },
  {
    pattern: /^\/new-keys(\/.*)?$/,
    description: "Password reset — user is unauthenticated by definition",
  },
  {
    pattern: /^\/gate(\/.*)?$/,
    description:
      "Student login gate — redirect authenticated users to their portal",
    resolve: (session) => resolveGateRedirect(session, "student"),
  },
  {
    pattern: /^\/vendor-gate(\/.*)?$/,
    description:
      "Vendor login gate — redirect authenticated users to their portal",
    resolve: (session) => resolveGateRedirect(session, "vendor"),
  },
  {
    pattern: /^\/admin-gate(\/.*)?$/,
    description:
      "Admin login gate — redirect authenticated users to their portal",
    resolve: (session) => resolveGateRedirect(session, "admin"),
  },
];
