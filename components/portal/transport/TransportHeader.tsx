"use client";

import { ArrowLeft, Bus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

const tabs = ["Browse Vendors", "Shared Rides", "My Trips"] as const;
type Tab = (typeof tabs)[number];

export default function TransportHeader() {
  return (
    <>
      {/* Back + heading */}
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

export { tabs };
export type { Tab };
