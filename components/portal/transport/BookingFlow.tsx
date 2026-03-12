"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  MapPin,
  Clock,
  ArrowRight,
  Bus,
  ChevronLeft,
  StickyNote,
  CheckCircle2,
  Copy,
  MessageCircle,
} from "lucide-react";
import type { Vendor, VendorLocation } from "./vendorData";

type Step = "pick-destination" | "ride-summary" | "payment" | "success";
type RideType = "Private Ride" | "Shared Ride";

export default function BookingFlow({
  vendor,
  open,
  onClose,
}: {
  vendor: Vendor;
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("pick-destination");
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<VendorLocation | null>(null);
  const [rideType, setRideType] = useState<RideType>("Private Ride");
  const [notes, setNotes] = useState("");
  const [bookingRef] = useState(
    () =>
      `TRX-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
  );
  const [copied, setCopied] = useState(false);

  const filteredLocations = useMemo(() => {
    if (!search.trim()) return vendor.locations;
    const q = search.toLowerCase();
    return vendor.locations.filter((l) => l.name.toLowerCase().includes(q));
  }, [search, vendor.locations]);

  function reset() {
    setStep("pick-destination");
    setSearch("");
    setSelectedLocation(null);
    setRideType("Private Ride");
    setNotes("");
    setCopied(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSelectLocation(loc: VendorLocation) {
    setSelectedLocation(loc);
    setStep("ride-summary");
  }

  function handlePay() {
    setStep("payment");
    // Simulate payment processing
    setTimeout(() => {
      setStep("success");
    }, 2000);
  }

  function handleCopyRef() {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const finalPrice = selectedLocation
    ? rideType === "Shared Ride"
      ? `₦${Math.round(selectedLocation.priceNum * 0.6).toLocaleString()}`
      : selectedLocation.price
    : "";

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="booking-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            key="booking-popup"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-portal-surface rounded-2xl w-full max-w-[480px] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-portal-border"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-portal-border flex-shrink-0">
              {step !== "pick-destination" && step !== "success" && (
                <button
                  onClick={() =>
                    setStep(
                      step === "ride-summary"
                        ? "pick-destination"
                        : "ride-summary",
                    )
                  }
                  className="w-8 h-8 rounded-lg bg-portal-bg border border-portal-border flex items-center justify-center hover:bg-portal-bg2 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-[15px] font-bold truncate">
                  {step === "pick-destination" && "Pick your destination"}
                  {step === "ride-summary" && "Ride Summary"}
                  {step === "payment" && "Processing Payment"}
                  {step === "success" && "Booking Confirmed!"}
                </h3>
                <p className="text-[11px] text-portal-muted truncate">
                  {vendor.name}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg bg-portal-bg border border-portal-border flex items-center justify-center hover:bg-portal-bg2 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* Step 1: Pick Destination */}
                {step === "pick-destination" && (
                  <motion.div
                    key="step-destination"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
                    {/* Search */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-muted" />
                      <input
                        type="text"
                        placeholder="Search destinations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-portal-bg border border-portal-border rounded-xl text-sm text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent transition-colors"
                      />
                    </div>

                    {/* Locations */}
                    <div className="space-y-1.5">
                      {filteredLocations.length === 0 && (
                        <p className="text-center text-[13px] text-portal-muted py-8">
                          No destinations found
                        </p>
                      )}
                      {filteredLocations.map((loc) => (
                        <button
                          key={loc.name}
                          onClick={() => handleSelectLocation(loc)}
                          className="w-full flex items-center gap-3 px-3.5 py-3 bg-portal-bg rounded-xl hover:bg-portal-bg2 hover:border-portal-accent-border border border-transparent transition-all text-left"
                        >
                          <div className="w-9 h-9 rounded-lg bg-portal-accent-bg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-portal-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-portal-text">
                              {loc.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-portal-muted" />
                              <span className="text-[11px] text-portal-muted">
                                ~{loc.estimatedTime}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-heading text-sm font-extrabold">
                              {loc.price}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-portal-muted flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Ride Summary */}
                {step === "ride-summary" && selectedLocation && (
                  <motion.div
                    key="step-summary"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
                    {/* Route card */}
                    <div className="bg-portal-bg rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-portal-accent" />
                          <div className="w-px h-6 bg-portal-border2" />
                          <div className="w-2.5 h-2.5 rounded-full bg-portal-green" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-[11px] text-portal-muted">
                              Pickup
                            </p>
                            <p className="text-[13px] font-semibold">
                              Main Gate
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-portal-muted">
                              Destination
                            </p>
                            <p className="text-[13px] font-semibold">
                              {selectedLocation.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3 border-t border-portal-border">
                        <div className="flex items-center gap-1.5 text-[12px] text-portal-text2">
                          <Clock className="w-3.5 h-3.5 text-portal-muted" />~
                          {selectedLocation.estimatedTime}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-portal-text2">
                          <Bus className="w-3.5 h-3.5 text-portal-muted" />
                          {vendor.name}
                        </div>
                      </div>
                    </div>

                    {/* Ride type toggle */}
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-2">
                        Ride Type
                      </p>
                      <div className="flex gap-2">
                        {(["Private Ride", "Shared Ride"] as RideType[]).map(
                          (type) => (
                            <button
                              key={type}
                              onClick={() => setRideType(type)}
                              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                                rideType === type
                                  ? "bg-portal-accent text-white border-portal-accent"
                                  : "bg-portal-bg text-portal-text2 border-portal-border hover:border-portal-accent-border"
                              }`}
                            >
                              {type}
                            </button>
                          ),
                        )}
                      </div>
                      {rideType === "Shared Ride" && (
                        <p className="text-[11px] text-portal-green mt-1.5">
                          40% discount applied for shared ride
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-2 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" />
                        Special Instructions (optional)
                      </p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. I have extra luggage, pick up at back gate..."
                        rows={2}
                        className="w-full px-3.5 py-2.5 bg-portal-bg border border-portal-border rounded-xl text-sm text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent transition-colors resize-none"
                      />
                    </div>

                    {/* Price breakdown */}
                    <div className="bg-portal-bg rounded-xl p-4 mb-4 space-y-2">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-text2">Base fare</span>
                        <span className="font-semibold">
                          {selectedLocation.price}
                        </span>
                      </div>
                      {rideType === "Shared Ride" && (
                        <div className="flex justify-between text-[13px]">
                          <span className="text-portal-green">
                            Shared ride discount
                          </span>
                          <span className="font-semibold text-portal-green">
                            -₦
                            {Math.round(
                              selectedLocation.priceNum * 0.4,
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-[14px] pt-2 border-t border-portal-border">
                        <span className="font-bold">Total</span>
                        <span className="font-heading font-extrabold text-base">
                          {finalPrice}
                        </span>
                      </div>
                    </div>

                    {/* Pay button */}
                    <button
                      onClick={handlePay}
                      className="w-full py-3 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[14px] font-semibold transition-all hover:-translate-y-0.5"
                    >
                      Confirm & Pay {finalPrice}
                    </button>
                  </motion.div>
                )}

                {/* Step 3: Payment processing */}
                {step === "payment" && (
                  <motion.div
                    key="step-payment"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 flex flex-col items-center justify-center py-16"
                  >
                    <div className="w-12 h-12 border-[3px] border-portal-border border-t-portal-accent rounded-full animate-spin mb-5" />
                    <p className="font-heading text-[15px] font-bold mb-1">
                      Processing payment...
                    </p>
                    <p className="text-[12px] text-portal-muted">
                      Please wait while we confirm your transaction
                    </p>
                  </motion.div>
                )}

                {/* Step 4: Success */}
                {step === "success" && selectedLocation && (
                  <motion.div
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-5"
                  >
                    {/* Success icon */}
                    <div className="flex flex-col items-center mb-5">
                      <div className="w-16 h-16 rounded-full bg-portal-green-bg flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-8 h-8 text-portal-green" />
                      </div>
                      <h3 className="font-heading text-[17px] font-extrabold mb-0.5">
                        Booking Confirmed!
                      </h3>
                      <p className="text-[12px] text-portal-muted text-center">
                        Your ride has been booked successfully
                      </p>
                    </div>

                    {/* Booking details */}
                    <div className="bg-portal-bg rounded-xl p-4 space-y-3 mb-4">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-muted">Booking Ref</span>
                        <button
                          onClick={handleCopyRef}
                          className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-portal-accent hover:underline"
                        >
                          {bookingRef}
                          <Copy className="w-3 h-3" />
                          {copied && (
                            <span className="text-[10px] text-portal-green">
                              Copied!
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-muted">Vendor</span>
                        <span className="font-semibold">{vendor.name}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-muted">Route</span>
                        <span className="font-semibold">
                          Main Gate → {selectedLocation.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-muted">Ride Type</span>
                        <span className="font-semibold">{rideType}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-muted">Est. Time</span>
                        <span className="font-semibold">
                          ~{selectedLocation.estimatedTime}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px] pt-2 border-t border-portal-border">
                        <span className="font-bold">Total Paid</span>
                        <span className="font-heading font-extrabold text-base">
                          {finalPrice}
                        </span>
                      </div>
                    </div>

                    {/* Vendor contact */}
                    {vendor.socials.find((s) => s.platform === "WhatsApp") && (
                      <div className="bg-portal-green-bg border border-green-200 rounded-xl p-3.5 flex items-center gap-3 mb-4">
                        <MessageCircle className="w-5 h-5 text-portal-green flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-portal-green">
                            Contact vendor on WhatsApp
                          </p>
                          <p className="text-[11px] text-portal-green/70">
                            {
                              vendor.socials.find(
                                (s) => s.platform === "WhatsApp",
                              )?.handle
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 py-2.5 bg-portal-bg border border-portal-border text-portal-text2 rounded-xl text-[13px] font-semibold hover:bg-portal-bg2 transition-colors"
                      >
                        Back to Vendors
                      </button>
                      <button
                        onClick={handleClose}
                        className="flex-1 py-2.5 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[13px] font-semibold transition-all"
                      >
                        View My Bookings
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
