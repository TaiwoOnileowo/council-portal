"use client";

import { motion } from "motion/react";
import { Search } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

export default function QuickBookBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.07, ease: "easeOut" }}
      className="relative bg-portal-surface border border-portal-border rounded-2xl p-6 mb-6 overflow-hidden"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-portal-muted mb-1.5">
        Quick Search
      </p>
      <h2 className="font-heading text-xl font-bold text-portal-text mb-5">
        Where are you headed?
      </h2>

      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
            From
          </label>
          <input
            type="text"
            placeholder="e.g. Main Gate"
            defaultValue="Main Gate"
            className="w-full px-3.5 py-2.5 bg-portal-bg border border-portal-border rounded-lg text-portal-text text-sm placeholder:text-portal-muted outline-none focus:border-portal-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-1.5">
            To
          </label>
          <input
            type="text"
            placeholder="e.g. Yaba"
            className="w-full px-3.5 py-2.5 bg-portal-bg border border-portal-border rounded-lg text-portal-text text-sm placeholder:text-portal-muted outline-none focus:border-portal-accent transition-colors"
          />
        </div>

        <button className="px-6 py-2.5 bg-portal-accent hover:bg-portal-accent2 text-white rounded-lg text-[13px] font-semibold transition-all hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap">
          <Search className="w-3.5 h-3.5" />
          Find Rides
        </button>
      </div>

      <BorderBeam duration={15} size={100} />
    </motion.div>
  );
}
