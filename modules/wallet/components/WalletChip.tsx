"use client";

import { BorderBeam } from "@/components/ui/border-beam";
import { getWalletBalance } from "@/lib/actions/wallet.action";
import { queryKeys } from "@/lib/query-keys";
import { useModalStore } from "@/lib/stores/modal.store";
import { useQuery } from "@tanstack/react-query";
import { Plus, Wallet } from "lucide-react";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";

export function WalletChip() {
  const { openTopUp } = useModalStore();
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id ?? "";

  const { data } = useQuery({
    queryKey: queryKeys.wallet.all(userId),
    queryFn: () => getWalletBalance(),
    enabled: !!userId,
  });

  const balanceNaira =
    data && "balance" in data && data.balance != null ? data.balance / 100 : null;

  const displayBalance =
    balanceNaira !== null ? `₦${balanceNaira.toLocaleString("en-NG")}` : "₦—";

  return (
    <div className="relative flex items-center gap-2.5 rounded-xl border border-portal-border bg-portal-surface pl-3 pr-1.5 py-1.5">
      <div className="w-7 h-7 rounded-lg bg-portal-accent-bg flex items-center justify-center flex-shrink-0">
        <Wallet className="w-[15px] h-[15px] text-portal-accent" />
      </div>
      <div className="leading-tight">
        <p className="text-[9px] uppercase tracking-[0.08em] text-portal-muted font-semibold">
          Wallet
        </p>
        <p className="text-[14px] font-bold font-heading text-portal-text">
          {displayBalance}
        </p>
      </div>
      <button
        onClick={() => openTopUp()}
        className="ml-1 flex items-center gap-1 px-2.5 py-1.5 bg-portal-accent text-white rounded-lg text-[12px] font-semibold hover:bg-portal-accent2 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Top Up
      </button>
      <BorderBeam duration={15} size={100} />
    </div>
  );
}
