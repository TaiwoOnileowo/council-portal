"use client";

import { BorderBeam } from "@/components/ui/border-beam";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { getVendorWalletSummary } from "@/lib/actions/payout.action";
import { formatBalance } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { useModalStore } from "@/lib/stores/modal.store";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Check, Copy, Plus, Wallet } from "lucide-react";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { useVirtualAccount } from "@/modules/wallet/hooks/useVirtualAccount";
import { useWalletBalance } from "@/modules/wallet/hooks/useWalletBalance";

export function WalletBalancePanel() {
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id ?? "";
  const isVendor = currentUser?.role === "VENDOR";
  const { copied, copy } = useCopyToClipboard();

  const { openTopUp, openWithdraw } = useModalStore();

  const { balanceKobo } = useWalletBalance({ enabled: !isVendor });

  const { data: vendorData } = useQuery({
    queryKey: queryKeys.vendor.wallet(userId),
    queryFn: () => getVendorWalletSummary(),
    enabled: !!userId && isVendor,
  });

  const { data: virtualAccount } = useVirtualAccount({ enabled: !isVendor });

  const vendorSummary = vendorData?.ok ? vendorData.data : null;
  const displayBalance = formatBalance(
    isVendor ? (vendorSummary?.balance ?? null) : balanceKobo,
  );

  return (
    <div className="relative overflow-hidden bg-portal-surface border border-portal-border rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
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
            onClick={() =>
              openWithdraw({
                availableKobo: vendorSummary?.balance ?? 0,
                bankAccount: vendorSummary?.bankAccount ?? null,
              })
            }
            disabled={!vendorSummary || vendorSummary.balance <= 0}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-portal-accent text-white rounded-xl text-[14px] font-semibold hover:bg-portal-accent2 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:enabled:-translate-y-0.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </button>
        ) : (
          <button
            onClick={() => openTopUp()}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-portal-accent text-white rounded-xl text-[14px] font-semibold hover:bg-portal-accent2 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Add Money
          </button>
        )}
      </div>

      {virtualAccount?.ok && (
        <button
          onClick={() => copy(virtualAccount.data.accountNumber)}
          className="mt-5 pt-5 border-t border-portal-border w-full flex items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1">
              Fund via Bank Transfer
            </p>
            <p className="text-[16px] font-extrabold text-portal-text tracking-wide">
              {virtualAccount.data.accountNumber}
            </p>
            <p className="text-[12px] text-portal-muted mt-0.5">
              {virtualAccount.data.bankName}
            </p>
          </div>
          {copied ? (
            <span className="flex items-center gap-1 text-[12px] font-semibold text-portal-green flex-shrink-0">
              <Check className="w-4 h-4" />
              Copied
            </span>
          ) : (
            <Copy className="w-4 h-4 text-portal-muted flex-shrink-0" />
          )}
        </button>
      )}

      <BorderBeam duration={15} size={120} />
    </div>
  );
}
