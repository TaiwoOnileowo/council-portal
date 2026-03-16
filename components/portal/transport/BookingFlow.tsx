"use client";

import type {
  PublicPriceList,
  PublicRoute,
  PublicVendor,
} from "@/lib/actions/vendor.action";
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  Copy,
  Info,
  MapPin,
  MessageCircle,
  Search,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

type Step =
  | "pick-destination"
  | "ride-summary"
  | "passenger-details"
  | "payment"
  | "success";

const HALLS = [
  "Charles Hall",
  "Daniel Hall",
  "Ester Hall",
  "Faith Hall",
  "Grace Hall",
  "Hephzibah Hall",
  "Joseph Hall",
  "Peter Hall",
  "Samuel Hall",
  "Deborah Hall",
] as const;

type Hall = (typeof HALLS)[number];

type PassengerForm = {
  name: string;
  hall: Hall | "";
  roomNumber: string;
  phone: string;
  parentsPhone: string;
};

type PassengerErrors = Partial<Record<keyof PassengerForm, string>>;

function validatePassenger(f: PassengerForm): PassengerErrors {
  const e: PassengerErrors = {};
  if (f.name.trim().length < 2) e.name = "Name must be at least 2 characters";
  if (!f.hall) e.hall = "Please select your hall";
  const room = f.roomNumber.trim().toUpperCase();
  if (!room) {
    e.roomNumber = "Room number is required";
  } else if (!/^[A-H][1-4](0[1-9]|1[0-3])$/.test(room)) {
    e.roomNumber = "Invalid format — e.g. E401, A113 (rooms 01–13 per floor)";
  }
  if (!/^\d{11}$/.test(f.phone)) e.phone = "Must be exactly 11 digits";
  if (!/^\d{11}$/.test(f.parentsPhone))
    e.parentsPhone = "Must be exactly 11 digits";
  return e;
}

const STEP_BACK: Partial<Record<Step, Step>> = {
  "ride-summary": "pick-destination",
  "passenger-details": "ride-summary",
};

export default function BookingFlow({
  vendor,
  priceList,
  open,
  onClose,
  initialRoute,
  user,
}: {
  vendor: PublicVendor;
  priceList: PublicPriceList;
  open: boolean;
  onClose: () => void;
  initialRoute?: PublicRoute | null;
  user: { name: string; phone: string };
}) {
  const isLeaving = priceList.direction === "LEAVING";

  const [step, setStep] = useState<Step>(
    initialRoute ? "ride-summary" : "pick-destination",
  );
  const [search, setSearch] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<PublicRoute | null>(
    initialRoute ?? null,
  );
  const [passenger, setPassenger] = useState<PassengerForm>({
    name: user.name,
    hall: "",
    roomNumber: "",
    phone: user.phone,
    parentsPhone: "",
  });
  const [passengerErrors, setPassengerErrors] = useState<PassengerErrors>({});
  const [bookingRef] = useState(
    () =>
      `TRX-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
  );
  const [copied, setCopied] = useState(false);

  const filteredRoutes = useMemo(() => {
    if (!search.trim()) return priceList.routes;
    const q = search.toLowerCase();
    return priceList.routes.filter((r) => r.name.toLowerCase().includes(q));
  }, [search, priceList.routes]);

  function reset() {
    setStep("pick-destination");
    setSearch("");
    setSelectedRoute(null);
    setPassenger({
      name: user.name,
      hall: "",
      roomNumber: "",
      phone: user.phone,
      parentsPhone: "",
    });
    setPassengerErrors({});
    setCopied(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSelectRoute(route: PublicRoute) {
    setSelectedRoute(route);
    setStep("ride-summary");
  }

  function handlePassengerChange(field: keyof PassengerForm, value: string) {
    setPassenger((prev) => ({ ...prev, [field]: value }));
    if (passengerErrors[field]) {
      setPassengerErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function handleProceedToPayment() {
    const errors = validatePassenger(passenger);
    if (Object.keys(errors).length > 0) {
      setPassengerErrors(errors);
      return;
    }
    setStep("payment");
    setTimeout(() => setStep("success"), 2000);
  }

  function handleCopyRef() {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const basePrice = selectedRoute?.price ?? 0;
  const finalPrice = `₦${basePrice.toLocaleString()}`;

  const pickup = isLeaving
    ? "Covenant University"
    : (selectedRoute?.name ?? "");
  const destination = isLeaving
    ? (selectedRoute?.name ?? "")
    : "Covenant University";
  const directionLabel = isLeaving ? "Leaving School" : "Returning to School";

  const stepTitle: Record<Step, string> = {
    "pick-destination": "Pick Destination",
    "ride-summary": "Ride Summary",
    "passenger-details": "Your Details",
    payment: "Processing Payment",
    success: "Booking Confirmed!",
  };

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
              {STEP_BACK[step] && (
                <button
                  onClick={() => setStep(STEP_BACK[step]!)}
                  className="w-8 h-8 rounded-lg bg-portal-bg border border-portal-border flex items-center justify-center hover:bg-portal-bg2 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-[15px] font-bold truncate">
                  {stepTitle[step]}
                </h3>
                <p className="text-[11px] text-portal-muted truncate">
                  {vendor.transportName} · {directionLabel}
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
                {/* ── Step 1: Pick Destination ── */}
                {step === "pick-destination" && (
                  <motion.div
                    key="step-destination"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
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
                    <div className="space-y-1.5">
                      {filteredRoutes.length === 0 && (
                        <p className="text-center text-[13px] text-portal-muted py-8">
                          No destinations found
                        </p>
                      )}
                      {filteredRoutes.map((route) => (
                        <button
                          key={route.id}
                          onClick={() => handleSelectRoute(route)}
                          className="w-full flex items-center gap-3 px-3.5 py-3 bg-portal-bg rounded-xl hover:bg-portal-bg2 hover:border-portal-accent-border border border-transparent transition-all text-left"
                        >
                          <div className="w-9 h-9 rounded-lg bg-portal-accent-bg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-portal-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-portal-text">
                              {route.name}
                            </p>
                            {route.capacity !== null && (
                              <p className="text-[11px] text-portal-muted mt-0.5">
                                {route.capacity} seats
                              </p>
                            )}
                          </div>
                          <p className="font-heading text-sm font-extrabold flex-shrink-0">
                            ₦{route.price.toLocaleString()}
                          </p>
                          <ArrowRight className="w-4 h-4 text-portal-muted flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Ride Summary ── */}
                {step === "ride-summary" && selectedRoute && (
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
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-portal-muted mb-3">
                        {directionLabel}
                      </p>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex flex-col items-center gap-1 mt-1">
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
                              {pickup}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-portal-muted">
                              Destination
                            </p>
                            <p className="text-[13px] font-semibold">
                              {destination}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-3 border-t border-portal-border">
                        <div className="flex items-center gap-1.5 text-[12px] text-portal-text2">
                          <Bus className="w-3.5 h-3.5 text-portal-muted" />
                          {vendor.transportName}
                        </div>
                        {selectedRoute.capacity !== null && (
                          <div className="flex items-center gap-1.5 text-[12px] text-portal-text2">
                            <span className="text-portal-muted">·</span>
                            {selectedRoute.capacity} seats
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Luggage policy */}
                    {priceList.luggagePolicy && (
                      <div className="mb-4 flex gap-2.5 bg-portal-bg border border-portal-border rounded-xl px-3.5 py-3">
                        <Info className="w-3.5 h-3.5 text-portal-muted flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-semibold text-portal-text2 mb-0.5">
                            Luggage Policy
                          </p>
                          <p className="text-[12px] text-portal-muted">
                            {priceList.luggagePolicy}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Vendor notes */}
                    {priceList.notes && (
                      <div className="mb-4 flex gap-2.5 bg-portal-blue-bg border border-blue-200 rounded-xl px-3.5 py-3">
                        <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-semibold text-portal-text2 mb-0.5">
                            Note from {vendor.transportName}
                          </p>
                          <p className="text-[12px] text-portal-text2 leading-relaxed">
                            {priceList.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="bg-portal-bg rounded-xl p-4 mb-4 flex justify-between items-center">
                      <span className="text-[13px] text-portal-text2 font-medium">
                        Fare
                      </span>
                      <span className="font-heading font-extrabold text-base">
                        {finalPrice}
                      </span>
                    </div>

                    <button
                      onClick={() => setStep("passenger-details")}
                      className="w-full py-3 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[14px] font-semibold transition-all hover:-translate-y-0.5"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {/* ── Step 3: Passenger Details ── */}
                {step === "passenger-details" && (
                  <motion.div
                    key="step-passenger"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 space-y-4"
                  >
                    {/* Name */}
                    <Field label="Full Name" error={passengerErrors.name}>
                      <input
                        type="text"
                        value={passenger.name}
                        onChange={(e) =>
                          handlePassengerChange("name", e.target.value)
                        }
                        placeholder="Your full name"
                        className={inputCls(!!passengerErrors.name)}
                      />
                    </Field>

                    {/* Hall */}
                    <Field
                      label="Hall of Residence"
                      error={passengerErrors.hall}
                    >
                      <div className="relative">
                        <select
                          value={passenger.hall}
                          onChange={(e) =>
                            handlePassengerChange("hall", e.target.value)
                          }
                          className={`${inputCls(!!passengerErrors.hall)} appearance-none pr-8`}
                        >
                          <option value="">Select your hall</option>
                          {HALLS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-portal-muted pointer-events-none" />
                      </div>
                    </Field>

                    {/* Room Number */}
                    <Field
                      label="Room Number"
                      hint="Format: letter (A–H) + floor (1–4) + room (01–13) — e.g. E401, A113"
                      error={passengerErrors.roomNumber}
                    >
                      <input
                        type="text"
                        value={passenger.roomNumber}
                        onChange={(e) =>
                          handlePassengerChange(
                            "roomNumber",
                            e.target.value.toUpperCase(),
                          )
                        }
                        placeholder="e.g. E401"
                        maxLength={4}
                        className={inputCls(!!passengerErrors.roomNumber)}
                      />
                    </Field>

                    {/* Phone */}
                    <Field
                      label="Your Phone Number"
                      error={passengerErrors.phone}
                    >
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={passenger.phone}
                        onChange={(e) =>
                          handlePassengerChange(
                            "phone",
                            e.target.value.replace(/\D/g, "").slice(0, 11),
                          )
                        }
                        placeholder="08012345678"
                        className={inputCls(!!passengerErrors.phone)}
                      />
                    </Field>

                    {/* Parents Phone */}
                    <Field
                      label="Parent / Guardian Phone"
                      error={passengerErrors.parentsPhone}
                    >
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={passenger.parentsPhone}
                        onChange={(e) =>
                          handlePassengerChange(
                            "parentsPhone",
                            e.target.value.replace(/\D/g, "").slice(0, 11),
                          )
                        }
                        placeholder="08012345678"
                        className={inputCls(!!passengerErrors.parentsPhone)}
                      />
                    </Field>

                    <button
                      onClick={handleProceedToPayment}
                      className="w-full py-3 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[14px] font-semibold transition-all hover:-translate-y-0.5"
                    >
                      Confirm & Pay {finalPrice}
                    </button>
                  </motion.div>
                )}

                {/* ── Step 4: Payment Processing ── */}
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

                {/* ── Step 5: Success ── */}
                {step === "success" && selectedRoute && (
                  <motion.div
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-5"
                  >
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
                        <span className="font-semibold">
                          {vendor.transportName}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-muted">Route</span>
                        <span className="font-semibold">
                          {pickup} → {destination}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-muted">Passenger</span>
                        <span className="font-semibold">{passenger.name}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-muted">Room</span>
                        <span className="font-semibold">
                          {passenger.hall}, {passenger.roomNumber}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px] pt-2 border-t border-portal-border">
                        <span className="font-bold">Total Paid</span>
                        <span className="font-heading font-extrabold text-base">
                          {finalPrice}
                        </span>
                      </div>
                    </div>

                    <div className="bg-portal-green-bg border border-green-200 rounded-xl p-3.5 flex items-center gap-3 mb-4">
                      <MessageCircle className="w-5 h-5 text-portal-green flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-portal-green">
                          Contact vendor on WhatsApp
                        </p>
                        <p className="text-[11px] text-portal-green/70">
                          {vendor.phone}
                        </p>
                      </div>
                    </div>

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full px-3.5 py-2.5 bg-portal-bg border rounded-xl text-sm text-portal-text placeholder:text-portal-muted outline-none transition-colors ${
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-portal-border focus:border-portal-accent"
  }`;
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-portal-text2 mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-portal-muted mt-1">{hint}</p>
      )}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
