"use client";

import { X, MapPin, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PublicVendor,
  PublicPriceList,
  PublicRoute,
} from "@/lib/actions/transport.action";
import {
  isPriceListActive,
  closesToday,
  closesSoon,
  isVendorAvailable,
} from "@/modules/transport/transport.utils";
import { textMatchRank, stripTrailingParenthetical } from "@/lib/utils";

type ActiveTab = "leaving" | "returning";

export default function VendorDetailPopup({
  vendor,
  open,
  onClose,
  onBookNow,
}: {
  vendor: PublicVendor;
  open: boolean;
  onClose: () => void;
  onBookNow: (
    vendor: PublicVendor,
    priceList: PublicPriceList,
    route: PublicRoute,
  ) => void;
}) {
  const leavingList = vendor.priceLists.find(
    (pl) => pl.direction === "LEAVING",
  );
  const returningList = vendor.priceLists.find(
    (pl) => pl.direction === "RETURNING",
  );

  const defaultTab: ActiveTab = leavingList ? "leaving" : "returning";
  const [tab, setTab] = useState<ActiveTab>(defaultTab);
  const [routeSearch, setRouteSearch] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const [isDescClamped, setIsDescClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    setIsDescClamped(el.scrollHeight > el.clientHeight + 1);
  }, [vendor.description]);

  function switchTab(next: ActiveTab) {
    setTab(next);
    setRouteSearch("");
  }

  const activeList = tab === "leaving" ? leavingList : returningList;
  const listAvailable = activeList ? isPriceListActive(activeList) : false;

  const filteredRoutes = useMemo(() => {
    if (!activeList) return [];
    const q = routeSearch.trim();
    if (!q) {
      return [...activeList.routes].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    }
    return activeList.routes
      .map((route) => ({
        route,
        rank: textMatchRank(stripTrailingParenthetical(route.name), q),
      }))
      .filter((r) => r.rank !== -1)
      .sort(
        (a, b) => a.rank - b.rank || a.route.name.localeCompare(b.route.name),
      )
      .map((r) => r.route);
  }, [activeList, routeSearch]);

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
            <div className="flex items-start gap-4 px-5 pt-5 pb-4 border-b border-portal-border flex-shrink-0">
              <div className="w-[54px] h-[54px] rounded-[14px] overflow-hidden flex-shrink-0 bg-portal-accent-bg flex items-center justify-center">
                {vendor.image ? (
                  <Image
                    src={vendor.image}
                    alt={vendor.transportName}
                    width={54}
                    height={54}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-portal-accent font-bold text-xl">
                    {vendor.transportName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-[18px] font-extrabold leading-tight">
                  {vendor.transportName}
                </h2>
                {vendor.tagline && (
                  <p className="text-[13px] text-portal-muted mt-0.5">
                    {vendor.tagline}
                  </p>
                )}
                <div className="mt-1.5">
                  {isVendorAvailable(vendor) ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Available now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-portal-muted bg-portal-accent-bg/50 px-2 py-0.5 rounded-full border border-portal-border">
                      <span className="w-1.5 h-1.5 rounded-full bg-portal-muted/60" />
                      Not available today
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-portal-accent-bg/50 border border-portal-border flex items-center justify-center hover:bg-portal-bg2 transition-colors flex-shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {vendor.description && (
                <div>
                  <p
                    ref={descRef}
                    className={`text-[13px] text-portal-text2 leading-relaxed ${
                      !descExpanded ? "line-clamp-3" : ""
                    }`}
                  >
                    {vendor.description}
                  </p>
                  {isDescClamped && (
                    <button
                      onClick={() => setDescExpanded((v) => !v)}
                      className="text-[12px] font-semibold text-portal-accent mt-1"
                    >
                      {descExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              )}

              {(leavingList || returningList) && (
                <>
                  {leavingList && returningList ? (
                    <div className="flex gap-1 bg-portal-accent-bg/50 rounded-lg p-1">
                      <button
                        onClick={() => switchTab("leaving")}
                        className={`flex-1 text-[13px] font-semibold py-2 rounded-md transition-all ${
                          tab === "leaving"
                            ? "bg-portal-surface text-portal-text shadow-sm"
                            : "text-portal-muted hover:text-portal-text2"
                        }`}
                      >
                        Leaving School
                      </button>
                      <button
                        onClick={() => switchTab("returning")}
                        className={`flex-1 text-[13px] font-semibold py-2 rounded-md transition-all ${
                          tab === "returning"
                            ? "bg-portal-surface text-portal-text shadow-sm"
                            : "text-portal-muted hover:text-portal-text2"
                        }`}
                      >
                        Returning to School
                      </button>
                    </div>
                  ) : (
                    <p className="text-[13px] font-semibold text-portal-text">
                      {leavingList ? "Leaving School" : "Returning to School"}
                    </p>
                  )}

                  {activeList && (
                    <div className="flex flex-wrap gap-1.5">
                      {!listAvailable && (
                        <span className="text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                          Not currently active
                        </span>
                      )}
                      {closesToday(activeList) && (
                        <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                          Closes today
                        </span>
                      )}
                      {closesSoon(activeList) && (
                        <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                          Closes soon
                        </span>
                      )}
                    </div>
                  )}

                  {activeList && activeList.routes.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-muted" />
                      <input
                        type="text"
                        placeholder="Search destinations..."
                        value={routeSearch}
                        onChange={(e) => setRouteSearch(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 bg-portal-accent-bg/50 border border-portal-border rounded-xl text-sm text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent transition-colors"
                      />
                      {routeSearch && (
                        <button
                          type="button"
                          onClick={() => setRouteSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {activeList && (
                    <div className="space-y-1.5">
                      {activeList.routes.length === 0 ? (
                        <p className="text-center text-[13px] text-portal-muted py-6">
                          No routes available
                        </p>
                      ) : filteredRoutes.length === 0 ? (
                        <p className="text-center text-[13px] text-portal-muted py-6">
                          No destinations found
                        </p>
                      ) : (
                        filteredRoutes.map((route) => (
                          <div
                            key={route.id}
                            className="flex items-center gap-3 px-3.5 py-3 bg-portal-accent-bg/50 rounded-xl hover:bg-portal-bg2 transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-portal-muted flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-portal-text">
                                {route.name}
                              </p>
                              {route.capacity !== null && (
                                <span className="inline-block mt-0.5 text-[10px] font-semibold text-portal-accent bg-portal-accent-bg border border-portal-accent-border px-1.5 py-0.5 rounded-md">
                                  {route.capacity} seats
                                </span>
                              )}
                            </div>
                            <p className="font-heading text-sm font-extrabold flex-shrink-0">
                              ₦{route.price.toLocaleString()}
                            </p>
                            <button
                              onClick={() =>
                                onBookNow(vendor, activeList, route)
                              }
                              disabled={!vendor.isActive || !listAvailable}
                              className="px-3 py-1.5 bg-portal-accent-bg border border-portal-accent-border rounded-lg text-portal-accent text-[12px] font-semibold hover:bg-portal-accent hover:text-white transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-portal-accent-bg disabled:hover:text-portal-accent"
                            >
                              Book
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
