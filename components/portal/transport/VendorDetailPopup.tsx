"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Star,
  Bus,
  Award,
  MapPin,
  Clock,
  Instagram,
  MessageCircle,
  Twitter,
  ExternalLink,
} from "lucide-react";
import type { Vendor } from "./vendorData";

function StarRating({
  full,
  size = "sm",
}: {
  full: number;
  size?: "sm" | "md";
}) {
  const s = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${s} ${
            i <= full
              ? "fill-amber-400 text-amber-400"
              : "fill-portal-border text-portal-border"
          }`}
        />
      ))}
    </div>
  );
}

function getSocialIcon(platform: string) {
  switch (platform) {
    case "Instagram":
      return Instagram;
    case "WhatsApp":
      return MessageCircle;
    case "Twitter":
      return Twitter;
    default:
      return ExternalLink;
  }
}

type ActiveTab = "prices" | "reviews";

export default function VendorDetailPopup({
  vendor,
  open,
  onClose,
  onBookNow,
}: {
  vendor: Vendor;
  open: boolean;
  onClose: () => void;
  onBookNow: (vendor: Vendor) => void;
}) {
  const [tab, setTab] = useState<ActiveTab>("prices");

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="vendor-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            key="vendor-popup"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-portal-surface rounded-2xl w-full max-w-[520px] max-h-[88vh] overflow-hidden flex flex-col shadow-2xl border border-portal-border"
          >
            {/* Cover + Logo */}
            <div className="relative flex-shrink-0">
              <div
                className={`h-[120px] bg-gradient-to-br ${vendor.coverGradient} relative`}
              >
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Availability badge */}
                {vendor.available ? (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-bold bg-green-500/90 text-white px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Available now
                  </div>
                ) : (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-bold bg-gray-500/80 text-white px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    Not available today
                  </div>
                )}
              </div>

              {/* Logo overlapping */}
              <div className="absolute -bottom-7 left-5">
                <div
                  className={`w-[58px] h-[58px] rounded-[16px] ${vendor.logoBg} flex items-center justify-center border-[3px] border-portal-surface shadow-lg`}
                >
                  <Bus className="w-6 h-6 text-portal-text2/60" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-10 pb-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="font-heading text-[19px] font-extrabold flex items-center gap-2">
                    {vendor.name}
                    {vendor.topRated && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-portal-gold-bg text-portal-gold border border-[#e8d5a0] px-2 py-0.5 rounded-md">
                        <Award className="w-3 h-3" />
                        Top Rated
                      </span>
                    )}
                  </h2>
                  <p className="text-[13px] text-portal-muted mt-0.5">
                    {vendor.tagline}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2 mb-4">
                <StarRating full={vendor.fullStars} size="md" />
                <span className="text-sm font-bold">{vendor.rating}</span>
                <span className="text-xs text-portal-muted">
                  ({vendor.reviews} reviews)
                </span>
              </div>

              {/* About */}
              <p className="text-[13px] text-portal-text2 leading-relaxed mb-4">
                {vendor.about}
              </p>

              {/* Socials */}
              <div className="flex flex-wrap gap-2 mb-5">
                {vendor.socials.map((s) => {
                  const Icon = getSocialIcon(s.platform);
                  return (
                    <div
                      key={s.platform}
                      className="flex items-center gap-1.5 text-xs text-portal-text2 bg-portal-bg border border-portal-border px-3 py-1.5 rounded-lg"
                    >
                      <Icon className="w-3.5 h-3.5 text-portal-muted" />
                      {s.handle}
                    </div>
                  );
                })}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-portal-bg rounded-lg p-1 mb-4">
                <button
                  onClick={() => setTab("prices")}
                  className={`flex-1 text-[13px] font-semibold py-2 rounded-md transition-all ${
                    tab === "prices"
                      ? "bg-portal-surface text-portal-text shadow-sm"
                      : "text-portal-muted hover:text-portal-text2"
                  }`}
                >
                  Destinations & Prices
                </button>
                <button
                  onClick={() => setTab("reviews")}
                  className={`flex-1 text-[13px] font-semibold py-2 rounded-md transition-all ${
                    tab === "reviews"
                      ? "bg-portal-surface text-portal-text shadow-sm"
                      : "text-portal-muted hover:text-portal-text2"
                  }`}
                >
                  Reviews ({vendor.reviews})
                </button>
              </div>

              {/* Tab content */}
              {tab === "prices" && (
                <div className="space-y-1.5">
                  {vendor.locations.map((loc) => (
                    <div
                      key={loc.name}
                      className="flex items-center gap-3 px-3.5 py-3 bg-portal-bg rounded-xl hover:bg-portal-bg2 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-portal-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-portal-text">
                          {loc.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-portal-muted" />
                          <span className="text-[11px] text-portal-muted">
                            ~{loc.estimatedTime}
                          </span>
                        </div>
                      </div>
                      <p className="font-heading text-sm font-extrabold flex-shrink-0">
                        {loc.price}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {tab === "reviews" && (
                <div className="space-y-3">
                  {vendor.reviewsList.map((rev, i) => (
                    <div
                      key={i}
                      className="bg-portal-bg rounded-xl px-4 py-3.5"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-full bg-portal-border2 flex items-center justify-center text-[11px] font-bold text-portal-text2">
                          {rev.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-[12px] font-semibold">
                            {rev.name}
                          </p>
                          <p className="text-[10px] text-portal-muted">
                            {rev.date}
                          </p>
                        </div>
                        <StarRating full={rev.rating} />
                      </div>
                      <p className="text-[12px] text-portal-text2 leading-relaxed ml-9">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-portal-border bg-portal-surface">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-portal-muted">Starting from</p>
                  <p className="font-heading text-lg font-extrabold">
                    {vendor.price}
                  </p>
                </div>
                <button
                  onClick={() => onBookNow(vendor)}
                  disabled={!vendor.available}
                  className="px-6 py-2.5 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[13px] font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Book Now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
