"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { BorderBeam } from "@/components/ui/border-beam";
import { getWalletBalance } from "@/lib/actions/wallet.action";
import TopUpModal from "@/modules/wallet/components/TopUpModal";

export function WalletBalancePanel() {
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
      <motion.div
        className="relative overflow-hidden bg-portal-surface border border-portal-border rounded-2xl p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div>
          <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center mb-4 bg-portal-accent-bg">
            <Wallet className="w-5 h-5 text-portal-accent" />
          </div>
          <p className="text-xs text-portal-muted font-medium">Wallet Balance</p>
          <p className="font-heading text-[34px] font-extrabold leading-none mt-1.5">
            {displayBalance}
          </p>
        </div>

        <button
          onClick={() => setTopUpOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-portal-accent text-white rounded-xl text-[14px] font-semibold hover:bg-portal-accent2 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Top Up
        </button>

        <BorderBeam duration={15} size={120} />
      </motion.div>

      <TopUpModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        user={session?.user as never}
      />
    </>
  );
}
