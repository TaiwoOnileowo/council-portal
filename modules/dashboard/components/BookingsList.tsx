"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { format, isToday, isTomorrow } from "date-fns";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { useBookings } from "@/modules/transport/hooks/useBookings";
import {
  STUDENT_BOOKINGS_PAGE_SIZE,
  type StudentBooking,
} from "@/modules/transport/transport.types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
  const [vendorId, setVendorId] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<StudentBooking | null>(null);

  const search = useDebouncedValue(searchInput.trim(), 300);
  const { data, isLoading, isFetching } = useBookings({
    vendorId,
    search,
    page,
  });

  const bookings = data?.bookings ?? [];
  const vendors = data?.vendors ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / STUDENT_BOOKINGS_PAGE_SIZE);

  const hasFilters = search !== "" || vendorId !== "all";
  const showControls = !isLoading && (vendors.length > 0 || hasFilters);

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

        {showControls && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(0);
                }}
                placeholder="Search route, vendor, ref or name"
                className="w-full bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text pl-8 pr-7 py-1.5 focus:outline-none focus:border-portal-accent"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setPage(0);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={vendorId}
                onChange={(e) => {
                  setVendorId(e.target.value);
                  setPage(0);
                }}
                className="w-full sm:w-auto appearance-none bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:border-portal-accent"
              >
                <option value="all">All vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
            </div>
          </div>
        )}

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
                {hasFilters ? "No matching bookings" : "No bookings yet"}
              </p>
              <p className="text-[12.5px] text-portal-muted mt-1">
                {hasFilters
                  ? "Try a different search or vendor"
                  : "Your transport bookings will appear here"}
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
