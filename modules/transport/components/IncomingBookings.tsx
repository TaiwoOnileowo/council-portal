"use client";

import Pagination from "@/components/ui/Pagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import TransportBookingDetailModal from "@/modules/transport/components/BookingDetailModal";
import { useTransportBookings } from "@/modules/transport/hooks/useTransportBookings";
import {
  VENDOR_BOOKINGS_PAGE_SIZE,
  type TransportBooking,
} from "@/modules/transport/transport.types";
import { format } from "date-fns";
import { ChevronDown, Loader2, Search, Users, X } from "lucide-react";
import { useState } from "react";
import DirectionBadge from "./DirectionBadge";
import MobileCard from "./MobileCard";
import StatusBadge from "./StatusBadge";

type Tab = "upcoming" | "past";

export default function IncomingBookings() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [route, setRoute] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<TransportBooking | null>(null);
  const [page, setPage] = useState(0);

  const search = useDebouncedValue(searchInput.trim(), 300);

  const { data, isLoading, isError, isFetching } = useTransportBookings({
    tab,
    route,
    dateFrom,
    dateTo,
    search,
    page,
  });

  const bookings = data?.bookings ?? [];
  const routes = data?.routes ?? [];
  const routeCounts = data?.routeCounts ?? {};
  const total = data?.total ?? 0;
  const allCount = Object.values(routeCounts).reduce((sum, n) => sum + n, 0);

  const pageCount = Math.ceil(total / VENDOR_BOOKINGS_PAGE_SIZE);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-heading text-[17px] font-bold">Bookings</h2>
        </div>

        <div className="flex items-center gap-1 bg-portal-accent-bg/502 rounded-xl p-1 mb-3 print:hidden">
          {(["upcoming", "past"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPage(0);
              }}
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

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mb-3 print:hidden">
          <div className="relative flex-1 sm:min-w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(0);
              }}
              placeholder="Search name, phone, ref, hall or room"
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
              value={route}
              onChange={(e) => {
                setRoute(e.target.value);
                setPage(0);
              }}
              className="w-full sm:w-auto appearance-none bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:border-portal-accent"
            >
              <option value="all">All routes ({allCount})</option>
              {routes.map((r) => (
                <option key={r} value={r}>
                  {r} ({routeCounts[r] ?? 0})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-portal-muted pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
              className="flex-1 sm:flex-none bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-1.5 focus:outline-none focus:border-portal-accent"
            />
            <span className="text-[11px] text-portal-muted">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
              className="flex-1 sm:flex-none bg-portal-surface border border-portal-border rounded-lg text-[12px] text-portal-text px-3 py-1.5 focus:outline-none focus:border-portal-accent"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setPage(0);
                }}
                className="text-[11px] text-portal-muted hover:text-portal-text underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {!isLoading && !isError && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <Users className="w-3.5 h-3.5 text-portal-muted" />
            <p className="text-[12px] text-portal-muted">
              <span className="font-semibold text-portal-text">{total}</span>{" "}
              {tab === "upcoming" ? "upcoming" : "past"} booking
              {total !== 1 ? "s" : ""}
              {route !== "all" && (
                <>
                  {" · "}
                  <span className="font-medium text-portal-text2">{route}</span>
                </>
              )}
              {dateFrom && (
                <>
                  {" · "}
                  {format(new Date(dateFrom), "MMM d")}
                  {dateTo
                    ? ` – ${format(new Date(dateTo), "MMM d, yyyy")}`
                    : ""}
                </>
              )}
              {search && (
                <>
                  {" · matching "}
                  <span className="font-medium text-portal-text2">
                    “{search}”
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        <div className="hidden print:block mb-4">
          <h1 className="text-lg font-bold">
            {route === "all" ? "All Bookings" : route}
          </h1>
          <p className="text-sm text-gray-500">
            {tab === "upcoming" ? "Upcoming" : "Past"} · {total} booking
            {total !== 1 ? "s" : ""}
            {dateFrom && ` · from ${dateFrom}`}
            {dateTo && ` to ${dateTo}`}
          </p>
        </div>

        <div
          className={`bg-portal-surface border border-portal-border rounded-2xl overflow-hidden transition-opacity ${
            isFetching && !isLoading ? "opacity-60" : ""
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-portal-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[13px]">Loading bookings…</span>
            </div>
          ) : isError ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-red-400">
                Failed to load bookings
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-portal-muted">
                {search || route !== "all" || dateFrom || dateTo
                  ? "No bookings match your filters"
                  : tab === "upcoming"
                    ? "No upcoming bookings"
                    : "No past bookings"}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block print:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-portal-border bg-portal-accent-bg/50">
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
                        Departure
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
                        onClick={() => setSelected(booking)}
                        className={`border-b border-portal-border last:border-b-0 cursor-pointer hover:bg-portal-accent-bg/50 transition-colors ${
                          i % 2 === 0 ? "" : "bg-portal-accent-bg/50/40"
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] font-semibold text-portal-text">
                            {booking.passengerName}
                          </p>
                          <p className="text-[11px] text-portal-muted">
                            {booking.passengerPhone}
                          </p>
                          <p className="text-[10.5px] font-mono text-portal-muted/60 mt-0.5">
                            {booking.reference}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-portal-text">
                          {booking.routeName}
                        </td>
                        <td className="px-4 py-3.5">
                          <DirectionBadge direction={booking.direction} />
                        </td>
                        <td className="px-4 py-3.5 text-[12.5px] text-portal-text2">
                          {booking.departureAt
                            ? format(new Date(booking.departureAt), "d MMM · h:mm a")
                            : <span className="text-portal-muted/50">—</span>}
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

              <div className="md:hidden print:hidden divide-y divide-portal-border">
                {bookings.map((booking) => (
                  <MobileCard
                    key={booking.id}
                    booking={booking}
                    showStatus={tab === "past"}
                    onClick={() => setSelected(booking)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {!isLoading && !isError && (
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            className="mt-3.5"
          />
        )}
      </div>

      <TransportBookingDetailModal
        booking={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
