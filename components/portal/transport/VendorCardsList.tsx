"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import type {
  PublicVendor,
  PublicPriceList,
  PublicRoute,
} from "@/lib/actions/vendor.action";
import VendorDetailPopup from "./VendorDetailPopup";
import BookingFlow from "./BookingFlow";
import TopUpModal from "@/components/portal/TopUpModal";

export function isVendorAvailable(vendor: PublicVendor): boolean {
  if (!vendor.isActive) return false;
  const now = new Date();
  return vendor.priceLists.some((pl) => {
    if (pl.availType === "ACTIVE") return true;
    if (pl.availType === "INACTIVE") return false;
    if (pl.schedStart && now < pl.schedStart) return false;
    if (pl.schedEnd && now > pl.schedEnd) return false;
    return true;
  });
}

export default function VendorCardsList({
  vendors,
  user,
}: {
  vendors: PublicVendor[];
  user: { id: string; name: string; phone: string; email: string };
}) {
  const [detailVendor, setDetailVendor] = useState<PublicVendor | null>(null);
  const [bookingVendor, setBookingVendor] = useState<PublicVendor | null>(null);
  const [bookingPriceList, setBookingPriceList] =
    useState<PublicPriceList | null>(null);
  const [bookingRoute, setBookingRoute] = useState<PublicRoute | null>(null);

  // Top-up modal state — lifted here so it renders outside BookingFlow's stacking context
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpPrefill, setTopUpPrefill] = useState(0);
  const [topUpOnSuccess, setTopUpOnSuccess] = useState<(() => void) | null>(
    null,
  );

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

  const handleOpenTopUp = useCallback(
    (prefill: number, onSuccess: () => void) => {
      setTopUpPrefill(prefill);
      setTopUpOnSuccess(() => onSuccess);
      setTopUpOpen(true);
    },
    [],
  );

  function handleTopUpClose() {
    setTopUpOpen(false);
    setTopUpOnSuccess(null);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.21, ease: "easeOut" }}
        className="mb-7"
      >
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-heading text-[17px] font-bold">All Vendors</h2>
        </div>

        <div className="grid grid-cols-3 gap-3.5">
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
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1 text-[10px] font-semibold text-portal-muted bg-portal-bg border border-portal-border px-2 py-0.5 rounded-md">
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
      </motion.div>

      {detailVendor && (
        <VendorDetailPopup
          vendor={detailVendor}
          open={!!detailVendor}
          onClose={() => setDetailVendor(null)}
          onBookNow={handleBookNow}
        />
      )}

      {bookingVendor && bookingPriceList && (
        <BookingFlow
          vendor={bookingVendor}
          priceList={bookingPriceList}
          open={!!bookingVendor}
          onClose={() => {
            setBookingVendor(null);
            setBookingPriceList(null);
            setBookingRoute(null);
          }}
          initialRoute={bookingRoute}
          user={user}
          onOpenTopUp={handleOpenTopUp}
        />
      )}

      <TopUpModal
        open={topUpOpen}
        onClose={handleTopUpClose}
        prefilledAmount={topUpPrefill}
        onSuccess={topUpOnSuccess ?? undefined}
      />
    </>
  );
}
