"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { checkBookingCheckoutStatus } from "@/lib/actions/booking.action";
import { queryKeys } from "@/lib/query-keys";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";

type ConfirmState = "checking" | "success" | "failed" | "timeout";

const MAX_POLL_ATTEMPTS = 15; // ~45s at 3s intervals
const AUTO_DISMISS_MS = 3000;

function isKnownIncomplete(status: string | undefined) {
  return status === "cancelled" || status === "failed";
}

const BANNER_CONFIG: Record<
  ConfirmState,
  { toneClass: string; icon: React.ReactNode; message: string }
> = {
  checking: {
    toneClass: "bg-portal-accent-bg/50 border-portal-border",
    icon: (
      <Loader2 className="w-4 h-4 text-portal-accent animate-spin flex-shrink-0" />
    ),
    message: "Confirming your booking...",
  },
  success: {
    toneClass: "bg-portal-green-bg border-portal-green/20",
    icon: <CheckCircle2 className="w-4 h-4 text-portal-green flex-shrink-0" />,
    message: "Payment received — your booking is confirmed.",
  },
  timeout: {
    toneClass: "bg-amber-50 border-amber-200",
    icon: <Loader2 className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    message:
      "Still waiting on confirmation — check back in a bit, we'll confirm your booking as soon as it clears.",
  },
  failed: {
    toneClass: "bg-red-50 border-red-200",
    icon: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    message: "That payment wasn't completed. You can try booking again.",
  },
};

export default function BookingCheckoutConfirmation({
  reference,
  initialStatus,
}: {
  reference: string;
  initialStatus?: string;
}) {
  const [state, setState] = useState<ConfirmState>(
    isKnownIncomplete(initialStatus) ? "failed" : "checking",
  );
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  function dismiss() {
    setDismissed(true);
    router.replace("/transport");
  }

  useEffect(() => {
    if (isKnownIncomplete(initialStatus)) return; // already resolved above

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;

    async function poll() {
      const result = await checkBookingCheckoutStatus(reference);
      if (cancelled) return;

      if ("error" in result || result.status === "FAILED") {
        setState("failed");
        return;
      }

      if (result.status === "SUCCESS") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.all(currentUser?.id ?? ""),
        });
        setState("success");
        return;
      }

      attempts += 1;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        setState("timeout");
        return;
      }

      timer = setTimeout(poll, 3000);
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reference, initialStatus, currentUser?.id, queryClient]);

  // Every resolved state — including timeout, there's nothing more this
  // banner can tell you once it's given up — clears itself from the URL
  // after a moment, so it doesn't linger or reappear if the user comes back.
  useEffect(() => {
    if (state === "checking") return;
    const timer = setTimeout(
      () => router.replace("/transport"),
      AUTO_DISMISS_MS,
    );
    return () => clearTimeout(timer);
  }, [state, router]);

  if (dismissed) return null;

  const { toneClass, icon, message } = BANNER_CONFIG[state];

  return (
    <div
      className={`mb-5 flex items-center gap-3 border rounded-xl px-4 py-3 ${toneClass}`}
    >
      {icon}
      <p className="text-[13px] text-portal-text flex-1">{message}</p>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-portal-muted hover:text-portal-text flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
