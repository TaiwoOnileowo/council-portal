"use client";

import { motion } from "motion/react";

export default function TransportHeader() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-[24px] font-extrabold text-portal-text flex items-center gap-2.5">
              Transport
            </h1>
            <p className="text-[13px] text-portal-muted mt-1">
              Book rides with council-approved transport vendors
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
