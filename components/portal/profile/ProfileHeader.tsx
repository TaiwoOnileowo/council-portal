"use client";

import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

export default function ProfileHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-portal-muted hover:text-portal-text hover:bg-portal-bg2 px-2.5 py-1.5 rounded-lg transition-all mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

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
