"use client";

import { BorderBeam } from "@/components/ui/border-beam";
import { getVendorWalletSummary } from "@/lib/actions/payout.action";
import { getWalletBalance } from "@/lib/actions/wallet.action";
import WithdrawModal from "@/modules/vendor/components/WithdrawModal";
import TopUpModal from "@/modules/wallet/components/TopUpModal";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Plus, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

export function WalletBalancePanel() {
  const { data: session } = useSession();
  const isVendor = session?.user?.role === "VENDOR";
  const [modalOpen, setModalOpen] = useState(false);

  const { data: balanceData } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => getWalletBalance(),
    enabled: !isVendor,
  });

  const { data: vendorData } = useQuery({
    queryKey: ["vendor-wallet"],
    queryFn: () => getVendorWalletSummary(),
    enabled: isVendor,
  });

  let balanceNaira: number | null = null;
  if (isVendor) {
    const d = vendorData?.ok ? vendorData.data : null;
    balanceNaira = d ? d.balance / 100 : null;
  } else {
    balanceNaira =
      balanceData && "balance" in balanceData && balanceData.balance != null
        ? balanceData.balance / 100
        : null;
  }

  const displayBalance =
    balanceNaira !== null ? `₦${balanceNaira.toLocaleString("en-NG")}` : "₦—";

  const vendorSummary = vendorData?.ok ? vendorData.data : null;

  return (
    <>
      <div className="relative overflow-hidden bg-portal-surface border border-portal-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div>
          <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center mb-4 bg-portal-accent-bg">
            <Wallet className="w-5 h-5 text-portal-accent" />
          </div>
          <p className="text-xs text-portal-muted font-medium">
            {isVendor ? "Available Balance" : "Wallet Balance"}
          </p>
          <p className="font-heading text-[34px] font-extrabold leading-none mt-1.5">
            {displayBalance}
          </p>
        </div>

        {isVendor ? (
          <button
            onClick={() => setModalOpen(true)}
            disabled={!vendorSummary || vendorSummary.balance <= 0}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-portal-accent text-white rounded-xl text-[14px] font-semibold hover:bg-portal-accent2 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:enabled:-translate-y-0.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </button>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-portal-accent text-white rounded-xl text-[14px] font-semibold hover:bg-portal-accent2 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Top Up
          </button>
        )}

        <BorderBeam duration={15} size={120} />
      </div>

      {isVendor ? (
        <WithdrawModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          availableKobo={vendorSummary?.balance ?? 0}
          bankAccount={vendorSummary?.bankAccount ?? null}
        />
      ) : (
        <TopUpModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          user={session?.user as never}
        />
      )}
    </>
  );
}
