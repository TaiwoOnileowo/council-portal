"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { format, isToday, isTomorrow } from "date-fns";
import { ChevronRight } from "lucide-react";
import { useBookings } from "@/modules/transport/hooks/useBookings";
import {
  STUDENT_BOOKINGS_PAGE_SIZE,
  type StudentBooking,
} from "@/modules/transport/transport.types";
import BookingDetailModal from "@/modules/dashboard/components/BookingDetailModal";
import Pagination from "@/components/ui/Pagination";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmed", color: "#2a7d4f" },
  PENDING: { label: "Pending", color: "#c9952a" },
  CANCELLED: { label: "Cancelled", color: "#ef4444" },
  FAILED: { label: "Failed", color: "#ef4444" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "d MMM");
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
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useBookings(page);
  const [selected, setSelected] = useState<StudentBooking | null>(null);

  const bookings = data?.bookings ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / STUDENT_BOOKINGS_PAGE_SIZE);

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

        <div
          className={`bg-portal-surface border border-portal-border rounded-2xl overflow-hidden transition-opacity ${
            isFetching && !isLoading ? "opacity-60" : ""
          }`}
        >
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : bookings.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13.5px] font-medium text-portal-text">
                No bookings yet
              </p>
              <p className="text-[12.5px] text-portal-muted mt-1">
                Your transport bookings will appear here
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
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
                    style={{ background: statusCfg.color }}
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
                        className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          color: statusCfg.color,
                          background: `${statusCfg.color}1a`,
                        }}
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

        {!isLoading && (
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            className="mt-3.5"
          />
        )}
      </motion.div>

      <BookingDetailModal
        booking={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
