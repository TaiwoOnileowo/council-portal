"use client";

import { BorderBeam } from "@/components/ui/border-beam";
import { getWalletBalance } from "@/lib/actions/wallet.action";
import TopUpModal from "@/modules/wallet/components/TopUpModal";
import { useQuery } from "@tanstack/react-query";
import { Plus, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

export function WalletChip() {
  const { data: session } = useSession();
  const [topUpOpen, setTopUpOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => getWalletBalance(),
  });

  const balanceNaira =
    data && "balance" in data && data.balance != null
      ? data.balance / 100
      : null;

  const displayBalance =
    balanceNaira !== null ? `₦${balanceNaira.toLocaleString("en-NG")}` : "₦—";

  return (
    <>
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
          onClick={() => setTopUpOpen(true)}
          className="ml-1 flex items-center gap-1 px-2.5 py-1.5 bg-portal-accent text-white rounded-lg text-[12px] font-semibold hover:bg-portal-accent2 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Top Up
        </button>
        <BorderBeam duration={15} size={100} />
      </div>

      <TopUpModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        user={session?.user as any}
      />
    </>
  );
}
