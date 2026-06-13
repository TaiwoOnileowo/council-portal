"use client";

import { Armchair, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const rides = [
  {
    from: "Main Gate",
    to: "Yaba",
    vendor: "SwiftMove NG",
    departure: "Departs 3:30 PM today",
    seats: 3,
    price: "₦8,500",
  },
  {
    from: "Main Gate",
    to: "Ikeja",
    vendor: "CampusLink",
    departure: "Departs 4:00 PM today",
    seats: 1,
    price: "₦7,000",
  },
  {
    from: "Main Gate",
    to: "Lekki",
    vendor: "UniRide Express",
    departure: "Departs 5:00 PM today",
    seats: 4,
    price: "₦11,000",
  },
];

export default function SharedRides() {
  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">
          Available Shared Rides
        </h2>
        <button className="text-[13px] font-medium text-portal-accent hover:underline">
          View all →
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {rides.map((ride, i) => (
          <motion.div
            key={i}
            whileHover={{ x: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-portal-surface border border-portal-border rounded-xl px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:border-portal-accent-border transition-colors"
          >
            {/* Route */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-portal-text">
                {ride.from}
                <ArrowRight className="w-3.5 h-3.5 text-portal-muted" />
                {ride.to}
              </div>
              <p className="text-xs text-portal-muted mt-1">
                {ride.vendor} · {ride.departure}
              </p>
            </div>

            {/* Seats */}
            <div className="flex items-center gap-1.5 text-xs text-portal-text2 bg-portal-accent-bg/50 border border-portal-border px-3 py-1.5 rounded-lg">
              <Armchair className="w-3.5 h-3.5" />
              <span>
                {ride.seats} seat{ride.seats !== 1 ? "s" : ""} left
              </span>
            </div>

            {/* Price */}
            <p className="font-heading text-base font-extrabold flex-shrink-0">
              {ride.price}
            </p>

            {/* Join */}
            <button className="px-4 py-1.5 bg-portal-accent-bg/50 border border-portal-border rounded-lg text-portal-text2 text-[13px] font-medium hover:border-portal-accent hover:text-portal-accent hover:bg-portal-accent-bg transition-all duration-200">
              Join Ride
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
