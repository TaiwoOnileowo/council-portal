"use client";

import { Car, Banknote, Clock } from "lucide-react";
import { motion } from "motion/react";
import { earnings } from "./vendorDashboardData";

const stats = [
  {
    icon: Car,
    iconBg: "bg-portal-accent-bg",
    iconColor: "text-portal-accent",
    value: String(earnings.totalRides),
    label: "Rides this semester",
  },
  {
    icon: Banknote,
    iconBg: "bg-portal-green-bg",
    iconColor: "text-portal-green",
    value: earnings.totalEarnings,
    label: "Total earnings",
  },
  {
    icon: Clock,
    iconBg: "bg-portal-gold-bg",
    iconColor: "text-portal-gold",
    value: earnings.pendingPayouts,
    label: "Pending payouts",
  },
];

export default function EarningsSummary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.14, ease: "easeOut" }}
      className="grid grid-cols-3 gap-3 mb-6"
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-portal-surface border border-portal-border rounded-xl px-4 py-3.5 flex items-center gap-3"
          >
            <div
              className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-[17px] h-[17px] ${stat.iconColor}`} />
            </div>
            <div>
              <p className="font-heading text-[20px] font-extrabold leading-none">
                {stat.value}
              </p>
              <p className="text-[11px] text-portal-muted mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
