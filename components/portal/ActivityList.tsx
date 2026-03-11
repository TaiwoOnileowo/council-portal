"use client";

import { motion } from "motion/react";
import { Bus, Wallet, Tent, TicketCheck } from "lucide-react";

const activities = [
  {
    icon: Bus,
    iconBg: "bg-portal-accent-bg",
    iconColor: "text-portal-accent",
    desc: "Ride booked",
    detail: "— SwiftMove NG, Gate → Yaba",
    time: "Today, 10:22 AM",
    amount: "−₦25,500",
    amountClass: "text-portal-accent",
  },
  {
    icon: Wallet,
    iconBg: "bg-portal-green-bg",
    iconColor: "text-portal-green",
    desc: "Wallet funded",
    detail: "— via Paystack",
    time: "Feb 15, 3:10 PM",
    amount: "+₦50,000",
    amountClass: "text-portal-green",
  },
  {
    icon: Tent,
    iconBg: "bg-portal-gold-bg",
    iconColor: "text-portal-gold",
    desc: "Canopy reserved",
    detail: "— Pavilion B, Feb 22",
    time: "Feb 14, 11:05 AM",
    amount: "−₦12,000",
    amountClass: "text-portal-accent",
  },
  {
    icon: TicketCheck,
    iconBg: "bg-portal-blue-bg",
    iconColor: "text-portal-blue",
    desc: "Ticket opened",
    detail: "— Welfare concern #TKT-0041",
    time: "Feb 12, 9:30 AM",
    amount: "Open",
    amountClass: "text-portal-muted",
  },
  {
    icon: Bus,
    iconBg: "bg-portal-accent-bg",
    iconColor: "text-portal-accent",
    desc: "Ride completed",
    detail: "— CampusLink, Gate → VI",
    time: "Feb 10, 5:45 PM",
    amount: "−₦8,000",
    amountClass: "text-portal-accent",
  },
];

export default function ActivityList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">Recent Activity</h2>
        <button className="text-[13px] font-medium text-portal-accent hover:underline">
          Full history →
        </button>
      </div>

      <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
        {activities.map((activity, i) => {
          const Icon = activity.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3.5 border-b border-portal-border last:border-b-0"
            >
              <div
                className={`w-8 h-8 rounded-lg ${activity.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-[15px] h-[15px] ${activity.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13px]">
                  <strong className="font-semibold">{activity.desc}</strong>{" "}
                  <span className="text-portal-muted">{activity.detail}</span>
                </span>
              </div>
              <span className="text-[11px] text-portal-muted flex-shrink-0 mr-4">
                {activity.time}
              </span>
              <span
                className={`text-[13px] font-bold flex-shrink-0 ${activity.amountClass}`}
              >
                {activity.amount}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
