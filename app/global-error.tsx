"use client";

import { useEffect } from "react";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import { TriangleAlert } from "lucide-react";
import { reportClientError } from "@/lib/client-log";
import { cn } from "@/lib/utils";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    reportClientError("[client]", error.message, error);

    if (error.name === "ChunkLoadError") {
      const key = "chunk-load-error-reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        className={cn(
          bricolage.variable,
          instrumentSans.variable,
          "font-sans antialiased bg-portal-accent-bg/50",
        )}
      >
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-portal-accent/10 flex items-center justify-center">
            <TriangleAlert className="w-5 h-5 text-portal-accent" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold text-portal-text">
              Something went wrong
            </h2>
            <p className="text-sm text-portal-text2 max-w-sm">
              We&apos;ve been notified and are looking into it.
            </p>
          </div>
          <button
            onClick={() => unstable_retry()}
            className="mt-2 px-5 py-2.5 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
