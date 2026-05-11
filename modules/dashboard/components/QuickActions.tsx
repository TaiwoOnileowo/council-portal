"use client";

import { Bus, Tent, TicketCheck, Wallet, ArrowRight } from "lucide-react";

const actions = [
  {
    icon: Bus,
    iconBg: "bg-portal-accent-bg",
    iconColor: "text-portal-accent",
    label: "Book a Ride",
    sub: "Browse available vendors",
  },
  {
    icon: Tent,
    iconBg: "bg-portal-gold-bg",
    iconColor: "text-portal-gold",
    label: "Reserve a Canopy",
    sub: "Check availability calendar",
  },
  {
    icon: TicketCheck,
    iconBg: "bg-portal-blue-bg",
    iconColor: "text-portal-blue",
    label: "Raise a Ticket",
    sub: "Get council support",
  },
  {
    icon: Wallet,
    iconBg: "bg-portal-green-bg",
    iconColor: "text-portal-green",
    label: "Fund Wallet",
    sub: "Add money via Paystack",
  },
];

export default function QuickActions() {
  return (
    <div>
      <h2 className="font-heading text-[17px] font-bold mb-3.5">
        Quick Actions
      </h2>

      <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 space-y-1.5">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer border border-transparent hover:bg-portal-bg hover:border-portal-border transition-all duration-200"
            >
              <div
                className={`w-9 h-9 rounded-[10px] ${action.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-[17px] h-[17px] ${action.iconColor}`} />
              </div>
              <div>
                <p className="text-[13.5px] font-medium text-portal-text">
                  {action.label}
                </p>
                <p className="text-[11px] text-portal-muted mt-0.5">
                  {action.sub}
                </p>
              </div>
              <ArrowRight className="ml-auto w-3.5 h-3.5 text-portal-muted" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
