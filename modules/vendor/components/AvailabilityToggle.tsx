"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Power } from "lucide-react";
import { toast } from "sonner";
import { updateVendorProfile } from "@/lib/actions/vendor.action";

type Props = {
  initialIsActive: boolean;
};

export default function AvailabilityToggle({ initialIsActive }: Props) {
  const [available, setAvailable] = useState(initialIsActive);
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    const next = !available;
    setAvailable(next);
    setIsPending(true);

    try {
      const result = await updateVendorProfile({ isActive: next });
      if (result?.error) throw new Error(result.error);
    } catch {
      setAvailable(!next);
      toast.error("Failed to update availability. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.07, ease: "easeOut" }}
      className="bg-portal-surface border border-portal-border rounded-2xl px-5 py-4 mb-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
            available ? "bg-portal-green-bg" : "bg-red-50"
          }`}
        >
          <Power
            className={`w-[17px] h-[17px] transition-colors ${
              available ? "text-portal-green" : "text-red-400"
            }`}
          />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-portal-text">
            {available ? "You're available for rides" : "You're currently offline"}
          </p>
          <p className="text-[12px] text-portal-muted mt-0.5">
            {available
              ? "Students can see and book your services"
              : "Students cannot book rides from you right now"}
          </p>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative w-[52px] h-[28px] rounded-full transition-colors duration-300 flex-shrink-0 disabled:opacity-70 ${
          available ? "bg-portal-green" : "bg-gray-300"
        }`}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-sm"
          style={{ left: available ? "27px" : "3px" }}
        />
      </button>
    </motion.div>
  );
}
