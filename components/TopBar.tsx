"use client";

import { motion } from "motion/react";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { WalletChip } from "@/modules/wallet/components/WalletChip";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function TopBar() {
  const { data: user } = useCurrentUser();
  const firstName = user?.firstName ?? "there";

  return (
    <motion.div
      className="flex items-center justify-between gap-4 mb-7"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div>
        <h1 className="font-heading text-[20px] sm:text-[26px] font-bold leading-tight text-portal-text">
          {getGreeting()},{" "}
          <span className="text-portal-accent">{firstName}</span>{" "}
          <span className="inline-block origin-[70%_70%] animate-[wave_2.5s_ease-in-out_infinite]">
            👋
          </span>
        </h1>
      </div>
      <WalletChip />
    </motion.div>
  );
}
