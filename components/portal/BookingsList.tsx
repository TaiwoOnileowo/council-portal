"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useBookings, type StudentBooking } from "@/lib/hooks/useBookings";
import BookingDetailModal from "@/components/portal/BookingDetailModal";

const STATUS_CONFIG = {
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-portal-green-bg text-portal-green",
  },
  PENDING: {
    label: "Pending",
    className: "bg-portal-gold-bg text-portal-gold",
  },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-500" },
  FAILED: { label: "Failed", className: "bg-red-50 text-red-500" },
};

const STATUS_DOT: Record<string, string> = {
  CONFIRMED: "#22c55e",
  PENDING: "#f59e0b",
  CANCELLED: "#ef4444",
  FAILED: "#ef4444",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-portal-border last:border-b-0 animate-pulse">
      <div className="w-2.5 h-2.5 rounded-full bg-portal-border flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-portal-border rounded w-3/4" />
        <div className="h-3 bg-portal-border rounded w-1/2" />
      </div>
      <div className="space-y-1.5 text-right">
        <div className="h-3.5 bg-portal-border rounded w-16 ml-auto" />
        <div className="h-4 bg-portal-border rounded-full w-20 ml-auto" />
      </div>
    </div>
  );
}

export default function BookingsList() {
  const { data, isLoading } = useBookings();
  const [selected, setSelected] = useState<StudentBooking | null>(null);

  const bookings = data?.bookings ?? [];
  const preview = bookings;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-heading text-[17px] font-bold">My Bookings</h2>
        </div>

        <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : preview.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13.5px] font-medium text-portal-text">
                No bookings yet
              </p>
              <p className="text-[12.5px] text-portal-muted mt-1">
                Your transport bookings will appear here
              </p>
            </div>
          ) : (
            preview.map((booking) => {
              const statusCfg =
                STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.CONFIRMED;
              return (
                <button
                  key={booking.id}
                  onClick={() => setSelected(booking)}
                  className="w-full flex items-center gap-3.5 px-5 py-3.5 border-b border-portal-border last:border-b-0 hover:bg-portal-bg transition-colors text-left"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      background: STATUS_DOT[booking.status] ?? "#22c55e",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-portal-text truncate">
                      {booking.vendor.transportName} — {booking.routeName}
                    </p>
                    <p className="text-xs text-portal-muted mt-0.5 truncate">
                      {booking.direction === "LEAVING"
                        ? "Leaving"
                        : "Returning"}{" "}
                      · {formatDate(booking.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <div>
                      <p className="text-[13px] font-bold font-heading">
                        ₦{(booking.fare + booking.serviceFee).toLocaleString()}
                      </p>
                      <span
                        className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-portal-muted flex-shrink-0" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </motion.div>

      <BookingDetailModal
        booking={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
