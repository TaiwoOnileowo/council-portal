"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { checkTopUpStatus } from "@/lib/actions/wallet.action";
import { queryKeys } from "@/lib/query-keys";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type ConfirmState = "checking" | "success" | "failed";

export default function TopUpConfirmation({
  reference,
}: {
  reference: string;
}) {
  const [state, setState] = useState<ConfirmState>("checking");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const result = await checkTopUpStatus(reference);
      if (cancelled) return;

      if ("error" in result || result.status === "FAILED") {
        setState("failed");
        return;
      }

      if (result.status === "SUCCESS") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.wallet.all(currentUser?.id ?? ""),
        });
        setState("success");
        return;
      }

      timer = setTimeout(poll, 3000);
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reference, currentUser?.id, queryClient]);

  // Drop ?topup_ref= from the URL once resolved, so refreshing doesn't
  // re-trigger this banner.
  useEffect(() => {
    if (state === "checking") return;
    const timer = setTimeout(() => router.replace("/wallet"), 3000);
    return () => clearTimeout(timer);
  }, [state, router]);

  if (state === "checking") {
    return (
      <div className="mb-5 flex items-center gap-3 bg-portal-accent-bg/50 border border-portal-border rounded-xl px-4 py-3">
        <Loader2 className="w-4 h-4 text-portal-accent animate-spin flex-shrink-0" />
        <p className="text-[13px] text-portal-text">
          Confirming your top-up...
        </p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="mb-5 flex items-center gap-3 bg-portal-green-bg border border-portal-green/20 rounded-xl px-4 py-3">
        <CheckCircle2 className="w-4 h-4 text-portal-green flex-shrink-0" />
        <p className="text-[13px] text-portal-text">
          Your wallet has been topped up.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <p className="text-[13px] text-portal-text">
        That payment wasn&apos;t completed. You can try again.
      </p>
    </div>
  );
}
