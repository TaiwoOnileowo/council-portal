"use client";

import { useState, useRef } from "react";
import { motion } from "motion/react";
import { format } from "date-fns";
import {
  Download,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Users,
} from "lucide-react";
import {
  useVendorBookings,
  type VendorBooking,
} from "@/lib/hooks/useVendorBookings";

type Tab = "upcoming" | "past";

export default function IncomingBookings() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [route, setRoute] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useVendorBookings({
    tab,
    route,
    dateFrom,
    dateTo,
  });

  const bookings = data?.bookings ?? [];
  const routes = data?.routes ?? [];
  // console.log("Bookings data:", data);
  function handlePrint() {
    window.print();
  }

  const showSummary = route !== "all" && bookings.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.21, ease: "easeOut" }}
      className="mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-heading text-[17px] font-bold">Bookings</h2>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-portal-muted hover:text-portal-text transition-colors print:hidden"
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-portal-bg2 rounded-xl p-1 mb-3 print:hidden">
        {(["upcoming", "past"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-[12.5px] font-medium rounded-lg transition-colors capitalize ${
              tab === t
                ? "bg-portal-surface text-portal-text shadow-sm"
                : "text-portal-muted hover:text-portal-text2"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3 print:hidden">
        {/* Route dropdown */}
        <div className="relative">
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="appearance-none bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:border-portal-accent"
          >
            <option value="all">All routes</option>
            {routes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
        </div>

        {/* Date from */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-1.5 focus:outline-none focus:border-portal-accent"
        />
        <span className="text-[11px] text-portal-muted">to</span>
        {/* Date to */}
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-1.5 focus:outline-none focus:border-portal-accent"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="text-[11px] text-portal-muted hover:text-portal-text underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary line when filtering by route */}
      {showSummary && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <Users className="w-3.5 h-3.5 text-portal-muted" />
          <p className="text-[12px] text-portal-muted">
            <span className="font-medium text-portal-text2">{route}</span>
            {dateFrom && (
              <>
                {" · "}
                {format(new Date(dateFrom), "MMM d")}
                {dateTo ? ` – ${format(new Date(dateTo), "MMM d, yyyy")}` : ""}
              </>
            )}
            {" · "}
            <span className="font-semibold text-portal-text">
              {bookings.length} student{bookings.length !== 1 ? "s" : ""} booked
            </span>
          </p>
        </div>
      )}

      {/* Print title (only visible during print) */}
      <div className="hidden print:block mb-4">
        <h1 className="text-lg font-bold">
          {route === "all" ? "All Bookings" : route}
        </h1>
        <p className="text-sm text-gray-500">
          {tab === "upcoming" ? "Upcoming" : "Past"} ·{" "}
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          {dateFrom && ` · from ${dateFrom}`}
          {dateTo && ` to ${dateTo}`}
        </p>
      </div>

      {/* Table container */}
      <div
        ref={printRef}
        className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-portal-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[13px]">Loading bookings…</span>
          </div>
        ) : isError ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-red-400">Failed to load bookings</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-portal-muted">
              {tab === "upcoming"
                ? "No upcoming bookings"
                : "No past bookings"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block print:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-portal-border bg-portal-bg">
                    <th className="text-left text-[11px] font-semibold text-portal-muted uppercase tracking-wide px-5 py-3">
                      Student
                    </th>
                    <th className="text-left text-[11px] font-semibold text-portal-muted uppercase tracking-wide px-4 py-3">
                      Route
                    </th>
                    <th className="text-left text-[11px] font-semibold text-portal-muted uppercase tracking-wide px-4 py-3">
                      Direction
                    </th>
                    <th className="text-left text-[11px] font-semibold text-portal-muted uppercase tracking-wide px-4 py-3">
                      Booked On
                    </th>
                    {tab === "past" && (
                      <th className="text-left text-[11px] font-semibold text-portal-muted uppercase tracking-wide px-4 py-3">
                        Status
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, i) => (
                    <tr
                      key={booking.id}
                      className={`border-b border-portal-border last:border-b-0 ${
                        i % 2 === 0 ? "" : "bg-portal-bg/40"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold text-portal-text">
                          {booking.passengerName}
                        </p>
                        <p className="text-[11px] text-portal-muted">
                          {booking.passengerPhone}
                        </p>
                        {booking.studentNotes && (
                          <p className="text-[11px] text-portal-accent mt-0.5 italic max-w-[200px] truncate" title={booking.studentNotes}>
                            &ldquo;{booking.studentNotes}&rdquo;
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-portal-text">
                        {booking.routeName}
                      </td>
                      <td className="px-4 py-3.5">
                        <DirectionBadge direction={booking.direction} />
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-portal-text2">
                        {format(new Date(booking.createdAt), "MMM d, yyyy")}
                      </td>
                      {tab === "past" && (
                        <td className="px-4 py-3.5">
                          <StatusBadge status={booking.status} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden print:hidden divide-y divide-portal-border">
              {bookings.map((booking) => (
                <MobileCard key={booking.id} booking={booking} showStatus={tab === "past"} />
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function DirectionBadge({ direction }: { direction: "LEAVING" | "RETURNING" }) {
  const isLeaving = direction === "LEAVING";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
        isLeaving
          ? "bg-portal-blue-bg text-portal-blue"
          : "bg-portal-green-bg text-portal-green"
      }`}
    >
      {isLeaving ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownLeft className="w-3 h-3" />
      )}
      {isLeaving ? "Leaving" : "Returning"}
    </span>
  );
}

function StatusBadge({ status }: { status: VendorBooking["status"] }) {
  const map: Record<VendorBooking["status"], { label: string; cls: string }> = {
    PENDING: { label: "Pending", cls: "bg-portal-gold-bg text-portal-gold" },
    CONFIRMED: { label: "Confirmed", cls: "bg-portal-green-bg text-portal-green" },
    CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-400" },
    FAILED: { label: "Failed", cls: "bg-red-50 text-red-400" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

function MobileCard({
  booking,
  showStatus,
}: {
  booking: VendorBooking;
  showStatus: boolean;
}) {
  return (
    <div className="px-4 py-3.5 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-portal-text truncate">
          {booking.passengerName}
        </p>
        <p className="text-[11.5px] text-portal-muted mt-0.5">
          {booking.routeName}
        </p>
        <p className="text-[11px] text-portal-muted mt-0.5">
          {format(new Date(booking.createdAt), "MMM d, yyyy")}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <DirectionBadge direction={booking.direction} />
        {showStatus && <StatusBadge status={booking.status} />}
      </div>
    </div>
  );
}
