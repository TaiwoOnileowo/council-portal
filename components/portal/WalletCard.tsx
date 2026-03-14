"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { BorderBeam } from "../ui/border-beam";
import { getWalletBalance } from "@/lib/actions/wallet.action";
import TopUpModal from "./TopUpModal";

export function WalletCard() {
  const [topUpOpen, setTopUpOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => getWalletBalance(),
  });

  const balanceNaira =
    data && "balance" in data && data.balance != null ? data.balance / 100 : null;

  const displayBalance =
    balanceNaira !== null
      ? `₦${balanceNaira.toLocaleString("en-NG")}`
      : "₦—";

  return (
    <>
      <motion.div
        className="col-span-2 relative bg-portal-surface border border-portal-border rounded-2xl p-5 flex flex-col justify-between"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.14, ease: "easeOut" }}
      >
        <div>
          <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-lg mb-3.5 bg-portal-accent-bg">
            <Wallet className="w-[18px] h-[18px] text-portal-accent" />
          </div>
          <p className="font-heading text-[28px] font-extrabold leading-none">
            {displayBalance}
          </p>
          <p className="text-xs text-portal-muted mt-1">Wallet Balance</p>
        </div>
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => setTopUpOpen(true)}
            className="px-4 py-2 bg-portal-accent text-white rounded-lg text-[13px] font-semibold hover:bg-portal-accent2 transition-colors"
          >
            Top Up
          </button>
          <button className="px-4 py-2 bg-portal-bg border border-portal-border text-portal-text2 rounded-lg text-[13px] font-medium hover:bg-portal-bg2 transition-colors">
            Transaction History
          </button>
        </div>
        <BorderBeam duration={15} size={100} />
      </motion.div>

      <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </>
  );
}
