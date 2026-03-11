"use client";

import { Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            height: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0,
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-portal-gold-bg border border-[#e8d5a0] rounded-xl px-4 py-3 flex items-center gap-3 mb-6"
        >
          <Megaphone className="w-4 h-4 text-portal-gold flex-shrink-0" />
          <p className="flex-1 text-[13.5px] text-portal-text2">
            <strong className="text-portal-text font-semibold">
              Resumption Transport, Booking Open:
            </strong>{" "}
            Rides for the 2025/2026 second semester resumption are now
            available. Book early to secure your preferred vendor.
          </p>
          <button
            onClick={() => setVisible(false)}
            className="text-portal-muted hover:text-portal-text transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
