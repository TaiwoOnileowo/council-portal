"use client";

import {
  ExternalLink,
  Instagram,
  MapPin,
  MessageCircle,
  Twitter,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import type { Vendor } from "./vendorData";

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
  onBookNow: (
    vendor: Vendor,
    location?: import("./vendorData").VendorLocation,
  ) => void;
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
              <div className="h-[120px] relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vendor.coverImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
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
                <div className="w-[58px] h-[58px] rounded-[16px] overflow-hidden border-[3px] border-portal-surface shadow-lg">
                  <Image
                    src={vendor.logo}
                    alt={vendor.name}
                    width={58}
                    height={58}
                    className="w-full h-full object-cover"
                  />
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
                    {/* {vendor.topRated && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-portal-gold-bg text-portal-gold border border-[#e8d5a0] px-2 py-0.5 rounded-md">
                        <Award className="w-3 h-3" />
                        Top Rated
                      </span>
                    )} */}
                  </h2>
                  <p className="text-[13px] text-portal-muted mt-0.5">
                    {vendor.tagline}
                  </p>
                </div>
              </div>

              {/* Rating */}
              {/* <div className="flex items-center gap-2 mt-2 mb-4">
                <StarRating full={vendor.fullStars} size="md" />
                <span className="text-sm font-bold">{vendor.rating}</span>
                <span className="text-xs text-portal-muted">
                  ({vendor.reviews} reviews)
                </span>
              </div> */}

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
                  Leaving School
                </button>
                <button
                  onClick={() => setTab("prices")}
                  className={`flex-1 text-[13px] font-semibold py-2 rounded-md transition-all ${
                    tab === "prices"
                      ? "bg-portal-surface text-portal-text shadow-sm"
                      : "text-portal-muted hover:text-portal-text2"
                  }`}
                >
                  Returning to School
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
                      </div>
                      <p className="font-heading text-sm font-extrabold flex-shrink-0">
                        {loc.price}
                      </p>
                      <button
                        onClick={() => onBookNow(vendor, loc)}
                        disabled={!vendor.available}
                        className="px-3 py-1.5 bg-portal-accent-bg border border-portal-accent-border rounded-lg text-portal-accent text-[12px] font-semibold hover:bg-portal-accent hover:text-white transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-portal-accent-bg disabled:hover:text-portal-accent"
                      >
                        Book
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
