"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import type {
  PublicVendor,
  PublicPriceList,
  PublicRoute,
} from "@/lib/actions/transport.action";
import {
  isPriceListActive,
  isVendorAvailable,
} from "@/modules/transport/transport.utils";
import { textMatchRank, stripTrailingParenthetical } from "@/lib/utils";
import { computeServiceFee } from "@/lib/money";
import VendorDetailPopup from "./VendorDetailModal";
import BookingFlow from "./BookingFlow";

type VendorRouteGroup = {
  vendor: PublicVendor;
  matches: { priceList: PublicPriceList; route: PublicRoute; rank: number }[];
};

const ROUTES_PER_VENDOR = 5;

export default function VendorCardsList({
  vendors,
  user,
  serviceFeeRate,
  serviceFeeCapNaira,
  walletEnabled,
}: {
  vendors: PublicVendor[];
  user: { id: string; name: string; phone: string; email: string };
  serviceFeeRate: number;
  serviceFeeCapNaira: number;
  walletEnabled: boolean;
}) {
  const [detailVendor, setDetailVendor] = useState<PublicVendor | null>(null);
  const [bookingVendor, setBookingVendor] = useState<PublicVendor | null>(null);
  const [bookingPriceList, setBookingPriceList] =
    useState<PublicPriceList | null>(null);
  const [bookingRoute, setBookingRoute] = useState<PublicRoute | null>(null);
  const [query, setQuery] = useState("");
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(
    new Set(),
  );

  function handleQueryChange(value: string) {
    setQuery(value);
    setExpandedVendors(new Set());
  }

  function toggleExpanded(vendorId: string) {
    setExpandedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(vendorId)) next.delete(vendorId);
      else next.add(vendorId);
      return next;
    });
  }

  function handleBookNow(
    vendor: PublicVendor,
    priceList: PublicPriceList,
    route: PublicRoute,
  ) {
    setDetailVendor(null);
    setBookingVendor(vendor);
    setBookingPriceList(priceList);
    setBookingRoute(route);
  }

  function handleBookingClose() {
    setBookingVendor(null);
    setBookingPriceList(null);
    setBookingRoute(null);
  }

  function handleBookingBack() {
    setDetailVendor(bookingVendor);
    handleBookingClose();
  }

  const routeGroups = useMemo<VendorRouteGroup[]>(() => {
    const q = query.trim();
    if (!q) return [];
    const groups: VendorRouteGroup[] = [];
    for (const vendor of vendors) {
      const matches: VendorRouteGroup["matches"] = [];
      for (const priceList of vendor.priceLists) {
        for (const route of priceList.routes) {
          const rank = textMatchRank(stripTrailingParenthetical(route.name), q);
          if (rank !== -1) matches.push({ priceList, route, rank });
        }
      }
      if (matches.length > 0) {
        matches.sort(
          (a, b) => a.rank - b.rank || a.route.name.localeCompare(b.route.name),
        );
        groups.push({ vendor, matches });
      }
    }
    groups.sort(
      (a, b) =>
        a.matches[0].rank - b.matches[0].rank ||
        a.vendor.transportName.localeCompare(b.vendor.transportName),
    );
    return groups;
  }, [query, vendors]);

  const isSearching = query.trim().length > 0;

  return (
    <>
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-heading text-[17px] font-bold">All Vendors</h2>
        </div>

        <div className="relative mb-3.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-muted" />
          <input
            type="text"
            placeholder="Search for a route or destination..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-portal-surface border border-portal-border rounded-xl text-sm text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSearching ? (
          <div className="space-y-5">
            {routeGroups.length === 0 ? (
              <p className="text-center text-[13px] text-portal-muted py-8">
                No routes found
              </p>
            ) : (
              routeGroups.map(({ vendor, matches }) => {
                const expanded = expandedVendors.has(vendor.id);
                const visible = expanded
                  ? matches
                  : matches.slice(0, ROUTES_PER_VENDOR);
                const hiddenCount = matches.length - visible.length;
                return (
                  <div key={vendor.id}>
                    <button
                      type="button"
                      onClick={() => setDetailVendor(vendor)}
                      className="group flex items-center gap-2.5 mb-2 text-left"
                    >
                      <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 bg-portal-accent-bg flex items-center justify-center">
                        {vendor.image ? (
                          <Image
                            src={vendor.image}
                            alt={vendor.transportName}
                            width={28}
                            height={28}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-portal-accent font-bold text-xs">
                            {vendor.transportName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading text-[13px] font-bold truncate group-hover:text-portal-accent transition-colors">
                          {vendor.transportName}
                        </h3>
                        {vendor.tagline && (
                          <p className="text-[11px] text-portal-muted truncate">
                            {vendor.tagline}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="space-y-1.5">
                      {visible.map(({ priceList, route }) => {
                        const bookable =
                          vendor.isActive && isPriceListActive(priceList);
                        return (
                          <div
                            key={route.id}
                            className="flex items-center gap-3 px-3.5 py-3 bg-portal-surface border border-portal-border rounded-xl hover:border-portal-accent-border transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-portal-text truncate">
                                {route.name}
                              </p>
                            </div>
                            <p className="font-heading text-sm font-extrabold flex-shrink-0">
                              &#x20A6;{route.price.toLocaleString()}
                            </p>
                            <button
                              onClick={() =>
                                handleBookNow(vendor, priceList, route)
                              }
                              disabled={!bookable}
                              className="px-3 py-1.5 bg-portal-accent-bg border border-portal-accent-border rounded-lg text-portal-accent text-[12px] font-semibold hover:bg-portal-accent hover:text-white transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-portal-accent-bg disabled:hover:text-portal-accent"
                            >
                              Book
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {matches.length > ROUTES_PER_VENDOR && (
                      <button
                        onClick={() => toggleExpanded(vendor.id)}
                        className="mt-1.5 text-[12px] font-semibold text-portal-accent hover:underline"
                      >
                        {expanded ? "Show less" : `Show ${hiddenCount} more`}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {vendors.map((vendor) => {
              const available = isVendorAvailable(vendor);
              return (
                <motion.div
                  key={vendor.id}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => setDetailVendor(vendor)}
                  className="group bg-portal-surface border border-portal-border rounded-2xl p-5 cursor-pointer relative overflow-hidden hover:border-portal-accent-border hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)] transition-all duration-220"
                >
                  {!available && (
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-1 text-[10px] font-semibold text-portal-muted bg-portal-accent-bg/50 border border-portal-border px-2 py-0.5 rounded-md">
                      Unavailable
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-[46px] h-[46px] rounded-[13px] overflow-hidden flex-shrink-0 bg-portal-accent-bg flex items-center justify-center">
                      {vendor.image ? (
                        <Image
                          src={vendor.image}
                          alt={vendor.transportName}
                          width={46}
                          height={46}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-portal-accent font-bold text-base">
                          {vendor.transportName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading text-[15px] font-bold">
                        {vendor.transportName}
                      </h3>
                      {vendor.tagline && (
                        <p className="text-xs text-portal-muted mt-0.5">
                          {vendor.tagline}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {detailVendor && (
        <VendorDetailPopup
          vendor={detailVendor}
          open={!!detailVendor}
          onClose={() => setDetailVendor(null)}
          onBookNow={handleBookNow}
        />
      )}

      {bookingVendor && bookingPriceList && bookingRoute && (
        <BookingFlow
          vendor={bookingVendor}
          priceList={bookingPriceList}
          route={bookingRoute}
          open={!!bookingVendor}
          onClose={handleBookingClose}
          onBack={handleBookingBack}
          user={user}
          serviceFee={computeServiceFee(
            bookingRoute.price,
            serviceFeeRate,
            serviceFeeCapNaira,
          )}
          walletEnabled={walletEnabled}
        />
      )}
    </>
  );
}
