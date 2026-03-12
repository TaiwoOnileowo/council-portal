"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, User, MapPin, Clock, Calendar } from "lucide-react";
import {
  incomingBookings,
  type IncomingBooking,
} from "./vendorDashboardData";

export default function IncomingBookings() {
  const [bookings, setBookings] = useState<IncomingBooking[]>(incomingBookings);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const handledBookings = bookings.filter((b) => b.status !== "pending");

  function handleAction(id: string, action: "accepted" | "declined") {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: action } : b))
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.21, ease: "easeOut" }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">
          Incoming Bookings
          {pendingBookings.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center bg-portal-accent text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px]">
              {pendingBookings.length}
            </span>
          )}
        </h2>
      </div>

      <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
        {pendingBookings.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-portal-muted">
              No pending bookings right now
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {pendingBookings.map((booking) => (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ duration: 0.25 }}
                className="px-5 py-4 border-b border-portal-border last:border-b-0 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Student avatar */}
                  <div className="w-9 h-9 rounded-full bg-portal-bg flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-portal-muted" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-portal-text truncate">
                      {booking.studentName}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-[12px] text-portal-muted">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Gate → {booking.destination}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {booking.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {booking.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      booking.rideType === "Private"
                        ? "bg-portal-blue-bg text-portal-blue"
                        : "bg-portal-gold-bg text-portal-gold"
                    }`}
                  >
                    {booking.rideType}
                  </span>
                  <span className="text-[14px] font-bold text-portal-text w-[72px] text-right">
                    {booking.price}
                  </span>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => handleAction(booking.id, "declined")}
                      className="w-8 h-8 rounded-lg border border-portal-border flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, "accepted")}
                      className="w-8 h-8 rounded-lg bg-portal-green text-white flex items-center justify-center hover:bg-portal-green/90 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Handled bookings summary */}
      {handledBookings.length > 0 && (
        <div className="mt-3 flex items-center gap-3 text-[12px] text-portal-muted px-1">
          {handledBookings.filter((b) => b.status === "accepted").length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Check className="w-3 h-3 text-portal-green" />
              {handledBookings.filter((b) => b.status === "accepted").length}{" "}
              accepted
            </span>
          )}
          {handledBookings.filter((b) => b.status === "declined").length > 0 && (
            <span className="inline-flex items-center gap-1">
              <X className="w-3 h-3 text-red-400" />
              {handledBookings.filter((b) => b.status === "declined").length}{" "}
              declined
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
