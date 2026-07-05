"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    fetch("/api/internal/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        path: window.location.pathname,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#666" }}>
            We&apos;ve been notified and are looking into it.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
