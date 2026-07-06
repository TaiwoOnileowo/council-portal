"use client";

// Client-side counterpart to `@/lib/logger` — relays unexpected failures to
// the server (and from there, to Telegram) via /api/internal/client-error.
// Browser console output alone disappears the moment the tab closes.
export function reportClientError(
  tag: string,
  message: string,
  meta?: unknown,
) {
  const err = meta instanceof Error ? (meta as Error & { digest?: string }) : undefined;

  fetch("/api/internal/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tag,
      message,
      stack: err?.stack,
      digest: err?.digest,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      meta: err ? { name: err.name } : meta,
    }),
  }).catch(() => {});
}
