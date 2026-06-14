"use client";

import { X, MapPin, Phone, Instagram, Copy, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
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
  const [phoneCopied, setPhoneCopied] = useState(false);

  function copyPhone() {
    navigator.clipboard.writeText(vendor.phone);
    setPhoneCopied(true);
    setTimeout(() => setPhoneCopied(false), 2000);
  }

  const activeList = tab === "leaving" ? leavingList : returningList;
  const listAvailable = activeList ? isPriceListActive(activeList) : false;

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

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {vendor.description && (
                <p className="text-[13px] text-portal-text2 leading-relaxed">
                  {vendor.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyPhone();
                  }}
                  className="flex items-center gap-1.5 text-xs text-portal-text2 bg-portal-accent-bg/50 border border-portal-border px-3 py-1.5 rounded-lg hover:border-portal-accent-border transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-portal-muted" />
                  {vendor.phone}
                  {phoneCopied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-portal-muted/60" />
                  )}
                </button>
                {vendor.instagram && (
                  <a
                    href={`https://instagram.com/${vendor.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-portal-text2 bg-portal-accent-bg/50 border border-portal-border px-3 py-1.5 rounded-lg hover:border-portal-accent-border transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5 text-portal-muted" />
                    {vendor.instagram}
                  </a>
                )}
                {vendor.tiktok && (
                  <a
                    href={`https://tiktok.com/@${vendor.tiktok.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-portal-text2 bg-portal-accent-bg/50 border border-portal-border px-3 py-1.5 rounded-lg hover:border-portal-accent-border transition-colors"
                  >
                    {/* TikTok icon via SVG */}
                    <svg
                      className="w-3.5 h-3.5 text-portal-muted"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.73a8.17 8.17 0 004.77 1.52V6.8a4.85 4.85 0 01-1-.11z" />
                    </svg>
                    {vendor.tiktok}
                  </a>
                )}
              </div>

              {/* Tabs */}
              {(leavingList || returningList) && (
                <>
                  <div className="flex gap-1 bg-portal-accent-bg/50 rounded-lg p-1">
                    {leavingList && (
                      <button
                        onClick={() => setTab("leaving")}
                        className={`flex-1 text-[13px] font-semibold py-2 rounded-md transition-all ${
                          tab === "leaving"
                            ? "bg-portal-surface text-portal-text shadow-sm"
                            : "text-portal-muted hover:text-portal-text2"
                        }`}
                      >
                        Leaving School
                      </button>
                    )}
                    {returningList && (
                      <button
                        onClick={() => setTab("returning")}
                        className={`flex-1 text-[13px] font-semibold py-2 rounded-md transition-all ${
                          tab === "returning"
                            ? "bg-portal-surface text-portal-text shadow-sm"
                            : "text-portal-muted hover:text-portal-text2"
                        }`}
                      >
                        Returning to School
                      </button>
                    )}
                  </div>

                  {/* Price list status badges */}
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
                      {activeList.luggagePolicy && (
                        <span className="text-[11px] text-portal-muted bg-portal-accent-bg/50 border border-portal-border px-2 py-0.5 rounded-full">
                          {activeList.luggagePolicy}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Routes */}
                  {activeList && (
                    <div className="space-y-1.5">
                      {activeList.routes.length === 0 ? (
                        <p className="text-center text-[13px] text-portal-muted py-6">
                          No routes available
                        </p>
                      ) : (
                        activeList.routes.map((route) => (
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

                  {/* Notes */}
                  {activeList?.notes && (
                    <p className="text-[12px] text-portal-muted italic">
                      {activeList.notes}
                    </p>
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
