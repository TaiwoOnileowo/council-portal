"use client";

import { BorderBeam } from "@/components/ui/border-beam";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { formatBalance } from "@/lib/format";
import { useModalStore } from "@/lib/stores/modal.store";
import { Check, Copy, Plus, Wallet } from "lucide-react";
import { useVirtualAccount } from "@/modules/wallet/hooks/useVirtualAccount";
import { useWalletBalance } from "@/modules/wallet/hooks/useWalletBalance";

export function WalletChip() {
  const { openTopUp } = useModalStore();
  const { balanceKobo } = useWalletBalance();
  const { data: virtualAccount } = useVirtualAccount();
  const { copied, copy } = useCopyToClipboard();

  const displayBalance = formatBalance(balanceKobo);

  return (
    <div className="relative rounded-xl border border-portal-border bg-portal-surface p-3">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-portal-accent-bg flex items-center justify-center flex-shrink-0">
          <Wallet className="w-[15px] h-[15px] text-portal-accent" />
        </div>
        <div className="leading-tight flex-1">
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
          Add Money
        </button>
      </div>

      {virtualAccount?.ok && (
        <button
          onClick={() => copy(virtualAccount.data.accountNumber)}
          className="mt-3 pt-3 border-t border-portal-border w-full flex items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-[13px] font-bold text-portal-text tracking-wide">
              {virtualAccount.data.accountNumber}
            </p>
            <p className="text-[10px] text-portal-muted mt-0.5">
              {virtualAccount.data.bankName}
            </p>
          </div>
          {copied ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-portal-green flex-shrink-0">
              <Check className="w-3.5 h-3.5" />
              Copied
            </span>
          ) : (
            <Copy className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
          )}
        </button>
      )}

      <BorderBeam duration={15} size={100} />
    </div>
  );
}
