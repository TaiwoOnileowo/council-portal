"use client";

import { ArrowRight, Bus, Wallet } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    icon: Bus,
    iconBg: "bg-portal-accent-bg",
    iconColor: "text-portal-accent",
    label: "Book a Ride",
    sub: "Browse available vendors",
    href: "/transport",
  },
  {
    icon: Wallet,
    iconBg: "bg-portal-green-bg",
    iconColor: "text-portal-green",
    label: "Fund Wallet",
    sub: "Add money via Paystack",
    href: "/wallet",
  },
];

export default function QuickActions() {
  return (
    <div>
      <h2 className="font-heading text-[17px] font-bold mb-3.5">
        Quick Actions
      </h2>

      <div className="bg-portal-surface border border-portal-border rounded-2xl p-5 space-y-1.5">
        {actions.map((action) => {
          const Icon = action.icon;

          const inner = (
            <>
              <div
                className={`w-9 h-9 rounded-[10px] ${action.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-[17px] h-[17px] ${action.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-portal-text">
                  {action.label}
                </p>
                <p className="text-[11px] text-portal-muted mt-0.5 truncate">
                  {action.sub}
                </p>
              </div>
              {action.href ? (
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-portal-muted" />
              ) : (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-portal-muted bg-portal-bg border border-portal-border rounded-full px-2 py-0.5">
                  Soon
                </span>
              )}
            </>
          );

          if (!action.href) {
            return (
              <div
                key={action.label}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-transparent opacity-60 cursor-not-allowed"
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-pointer border border-transparent hover:bg-portal-bg hover:border-portal-border transition-all duration-200"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
