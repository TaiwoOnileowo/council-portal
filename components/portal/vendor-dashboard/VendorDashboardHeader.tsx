"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";
import { vendorProfile } from "./vendorDashboardData";

export default function VendorDashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-[15px] font-extrabold text-blue-700 flex-shrink-0">
            {vendorProfile.initials}
          </div>
          <div>
            <h1 className="font-heading text-[24px] font-extrabold text-portal-text">
              {vendorProfile.name}
            </h1>
            {/* <p className="text-[13px] text-portal-muted mt-0.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-portal-gold">
                <Star className="w-3 h-3 fill-portal-gold" />
                {vendorProfile.rating}
              </span>
              <span className="text-portal-border">·</span>
              {vendorProfile.reviews} reviews
            </p> */}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
