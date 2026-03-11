"use client";

import { motion } from "motion/react";

export default function TopBar() {
  return (
    <motion.div
      className="flex items-start justify-between mb-7"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div>
        <h1 className="font-heading text-[26px] font-bold leading-tight text-portal-text">
          Good morning, <span className="text-portal-accent">Adeola</span>{" "}
          <span className="inline-block origin-[70%_70%] animate-[wave_2.5s_ease-in-out_infinite]">
            👋
          </span>
        </h1>
      </div>
    </motion.div>
  );
}
