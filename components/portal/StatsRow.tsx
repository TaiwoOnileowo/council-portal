"use client";

import { Bus } from "lucide-react";
import { motion } from "motion/react";
import { WalletCard } from "./WalletCard";

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;

  delay: number;
}

export function StatCard({
  icon,
  iconBg,
  value,
  label,

  delay,
}: StatCardProps) {
  return (
    <motion.div
      className="bg-portal-surface border border-portal-border rounded-2xl p-5 flex flex-col justify-between "
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      <div>
        <div
          className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-lg mb-3.5"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <p className="font-heading text-[28px] font-extrabold leading-none">
          {value}
        </p>
        <p className="text-xs text-portal-muted mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

export function StatsRow() {
  return (
    <div className="grid grid-cols-4 gap-3.5 mb-7">
      <WalletCard />
      {/* <StatCard
        icon={<Bus className="w-[18px] h-[18px] text-portal-accent" />}
        iconBg="#faf0f4"
        value="12"
        label="Rides taken"
        delay={0.18}
      /> */}
    </div>
  );
}
