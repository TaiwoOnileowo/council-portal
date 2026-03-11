"use client";

import { motion } from "motion/react";
import { Star, Bus, Award } from "lucide-react";

const vendors = [
  {
    name: "SwiftMove NG",
    tagline: "Fast & reliable campus-to-city rides",
    logoBg: "bg-gradient-to-br from-blue-100 to-blue-200",
    rating: 4.9,
    reviews: 214,
    fullStars: 5,
    price: "₦25,000",
    topRated: true,
  },
  {
    name: "CampusLink",
    tagline: "Affordable shared shuttles for students",
    logoBg: "bg-gradient-to-br from-red-100 to-red-200",
    rating: 4.6,
    reviews: 189,
    fullStars: 4,
    price: "₦18,000",
    topRated: false,
  },
  {
    name: "UniRide Express",
    tagline: "Premium executive rides to anywhere",
    logoBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
    rating: 4.8,
    reviews: 97,
    fullStars: 5,
    price: "₦35,000",
    topRated: false,
  },
  {
    name: "SafeTrips Ltd",
    tagline: "Group-friendly SUVs with top safety",
    logoBg: "bg-gradient-to-br from-violet-100 to-violet-200",
    rating: 4.5,
    reviews: 143,
    fullStars: 4,
    price: "₦28,000",
    topRated: false,
  },
  {
    name: "GoFast Motors",
    tagline: "Budget-friendly shuttles across Lagos",
    logoBg: "bg-gradient-to-br from-amber-100 to-amber-200",
    rating: 4.3,
    reviews: 78,
    fullStars: 4,
    price: "₦22,000",
    topRated: false,
  },
];

function StarRating({ full }: { full: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= full
              ? "fill-amber-400 text-amber-400"
              : "fill-portal-border text-portal-border"
          }`}
        />
      ))}
    </div>
  );
}

export default function VendorCards() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.21, ease: "easeOut" }}
      className="mb-7"
    >
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">All Vendors</h2>
        <button className="text-[13px] font-medium text-portal-accent hover:underline">
          Sort by rating ↓
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        {vendors.map((vendor) => (
          <motion.div
            key={vendor.name}
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="group bg-portal-surface border border-portal-border rounded-2xl p-5 cursor-pointer relative overflow-hidden hover:border-portal-accent-border hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)] transition-all duration-220"
          >
            {/* Top rated badge */}
            {vendor.topRated && (
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] font-bold bg-portal-gold-bg text-portal-gold border border-[#e8d5a0] px-2 py-1 rounded-md">
                <Award className="w-3 h-3" />
                Top Rated
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-3.5">
              <div
                className={`w-[46px] h-[46px] rounded-[13px] ${vendor.logoBg} flex items-center justify-center flex-shrink-0`}
              >
                <Bus className="w-5 h-5 text-portal-text2/60" />
              </div>
              <div>
                <h3 className="font-heading text-[15px] font-bold">
                  {vendor.name}
                </h3>
                <p className="text-xs text-portal-muted mt-0.5">
                  {vendor.tagline}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-2.5">
              <StarRating full={vendor.fullStars} />
              <span className="text-[13px] font-bold">{vendor.rating}</span>
              <span className="text-xs text-portal-muted">
                ({vendor.reviews} reviews)
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3.5 border-t border-portal-border">
              <div>
                <p className="text-xs text-portal-muted">From</p>
                <p className="font-heading text-base font-extrabold">
                  {vendor.price}
                </p>
              </div>
              <button className="px-4 py-1.5 bg-portal-accent-bg border border-portal-accent-border rounded-lg text-portal-accent text-[13px] font-semibold hover:bg-portal-accent hover:text-white transition-all duration-200">
                Book Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
