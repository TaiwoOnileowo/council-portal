"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { reportClientError } from "@/lib/client-log";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    reportClientError("[client]", error.message, error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
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
  );
}
