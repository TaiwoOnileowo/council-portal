"use client";

import { motion } from "motion/react";

const bookings = [
  {
    color: "#6B1E3D",
    title: "Transport — Gate → Yaba",
    meta: "SwiftMove NG · Today, 4:30 PM",
    amount: "₦25,500",
    status: "Active",
    statusClass: "bg-portal-green-bg text-portal-green",
  },
  {
    color: "#c9952a",
    title: "Canopy Booking — Pavilion B",
    meta: "For dept. fellowship · Feb 22, 2026",
    amount: "₦12,000",
    status: "Pending",
    statusClass: "bg-portal-gold-bg text-portal-gold",
  },
  {
    color: "#2350a0",
    title: "Transport — Gate → Ikeja",
    meta: "CampusLink · Feb 24, 2026 · 7:00 AM",
    amount: "₦8,000",
    status: "Confirmed",
    statusClass: "bg-portal-blue-bg text-portal-blue",
  },
];

export default function BookingsList() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">
          Active & Upcoming Bookings
        </h2>
        <button className="text-[13px] font-medium text-portal-accent hover:underline">
          View all →
        </button>
      </div>

      <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
        {bookings.map((booking, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 px-5 py-3.5 border-b border-portal-border last:border-b-0 hover:bg-portal-bg transition-colors cursor-pointer"
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: booking.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-portal-text truncate">
                {booking.title}
              </p>
              <p className="text-xs text-portal-muted mt-0.5 truncate">
                {booking.meta}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[13px] font-bold font-heading">
                {booking.amount}
              </p>
              <span
                className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${booking.statusClass}`}
              >
                {booking.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
