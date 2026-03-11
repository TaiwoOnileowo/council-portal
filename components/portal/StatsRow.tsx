"use client";

import { motion } from "motion/react";
import { Bus, TicketCheck, Wallet } from "lucide-react";
import { BorderBeam } from "../ui/border-beam";

export function WalletCard() {
  return (
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
          ₦85,000
        </p>
        <p className="text-xs text-portal-muted mt-1">Wallet Balance</p>
      </div>
      <div className="flex gap-2.5 mt-4">
        <button className="px-4 py-2 bg-portal-accent text-white rounded-lg text-[13px] font-semibold hover:bg-portal-accent2 transition-colors">
          Top Up
        </button>
        <button className="px-4 py-2 bg-portal-bg border border-portal-border text-portal-text2 rounded-lg text-[13px] font-medium hover:bg-portal-bg2 transition-colors">
          Transaction History
        </button>
      </div>
      <BorderBeam duration={15} size={100} />
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  trend: string;

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
      <StatCard
        icon={<Bus className="w-[18px] h-[18px] text-portal-accent" />}
        iconBg="#faf0f4"
        value="12"
        label="Rides taken"
        trendBg="#edf7f2"
        trendColor="#2a7d4f"
        delay={0.18}
      />
      {/* <StatCard
        icon={<TicketCheck className="w-[18px] h-[18px] text-portal-blue" />}
        iconBg="#eef2fb"
        value="1"
        label="Open help desk ticket"
        trend="● Awaiting response"
        trendBg="#fdf8ee"
        trendColor="#c9952a"
        delay={0.22}
      /> */}
    </div>
  );
}
