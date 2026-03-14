"use client";

import { motion } from "motion/react";

export default function ProfileHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="font-heading text-[24px] font-extrabold text-portal-text">
          Profile
        </h1>
        <p className="text-[13px] text-portal-muted mt-1">
          Manage your personal information and account settings
        </p>
      </div>
    </motion.div>
  );
}
