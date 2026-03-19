"use client";

import { motion } from "motion/react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function TopBar({ firstName }: { firstName: string }) {
  return (
    <motion.div
      className="flex items-start justify-between mb-7"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div>
        <h1 className="font-heading text-[20px] sm:text-[26px] font-bold leading-tight text-portal-text">
          {getGreeting()},{" "}
          <span className="text-portal-accent">{firstName}</span>{" "}
          <span className="inline-block origin-[70%_70%] animate-[wave_2.5s_ease-in-out_infinite]">
            👋
          </span>
        </h1>
      </div>
    </motion.div>
  );
}
