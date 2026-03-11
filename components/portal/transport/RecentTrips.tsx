"use client";

import { motion } from "motion/react";
import { Check, X, Circle } from "lucide-react";

const trips = [
  {
    vendor: "SwiftMove NG",
    route: "Gate → Yaba",
    dotColor: "bg-portal-green",
    date: "Feb 16 · 4:15 PM",
    amount: "₦25,500",
    type: "Private",
    status: "Completed",
    statusClass: "bg-portal-green-bg text-portal-green",
    StatusIcon: Check,
  },
  {
    vendor: "CampusLink",
    route: "Gate → VI",
    dotColor: "bg-portal-blue",
    date: "Feb 14 · 2:00 PM",
    amount: "₦8,000",
    type: "Shared",
    status: "Completed",
    statusClass: "bg-portal-green-bg text-portal-green",
    StatusIcon: Check,
  },
  {
    vendor: "GoFast Motors",
    route: "Gate → Ketu",
    dotColor: "bg-portal-gold",
    date: "Feb 12 · 8:30 AM",
    amount: "₦22,000",
    type: "Private",
    status: "Pending",
    statusClass: "bg-portal-gold-bg text-portal-gold",
    StatusIcon: Circle,
  },
  {
    vendor: "UniRide Express",
    route: "Gate → Airport",
    dotColor: "bg-red-500",
    date: "Feb 10 · 6:00 AM",
    amount: "₦40,000",
    type: "Private",
    status: "Cancelled",
    statusClass: "bg-red-50 text-red-500",
    StatusIcon: X,
  },
];

export default function RecentTrips() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.28, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">Recent Trips</h2>
        <button className="text-[13px] font-medium text-portal-accent hover:underline">
          Full history →
        </button>
      </div>

      <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr_110px] gap-3 px-5 py-3 bg-portal-bg border-b border-portal-border">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted">
            Vendor / Route
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted">
            Date & Time
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted">
            Amount
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted">
            Type
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted">
            Status
          </span>
        </div>

        {/* Rows */}
        {trips.map((trip, i) => {
          const Icon = trip.StatusIcon;
          return (
            <div
              key={i}
              className="grid grid-cols-[2fr_1.4fr_1fr_1fr_110px] gap-3 px-5 py-3.5 items-center border-b border-portal-border last:border-b-0 hover:bg-portal-bg transition-colors cursor-pointer text-[13px]"
            >
              <div className="flex items-center gap-2 font-semibold">
                <div
                  className={`w-2 h-2 rounded-full ${trip.dotColor} flex-shrink-0`}
                />
                <span className="truncate">
                  {trip.vendor} · {trip.route}
                </span>
              </div>
              <span className="text-portal-muted">{trip.date}</span>
              <span className="font-bold">{trip.amount}</span>
              <span className="text-portal-muted">{trip.type}</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit ${trip.statusClass}`}
              >
                <Icon className="w-3 h-3" />
                {trip.status}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
