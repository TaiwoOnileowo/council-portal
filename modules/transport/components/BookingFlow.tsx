"use client";

import { payBookingFromWallet } from "@/lib/actions/booking.action";
import type {
  PublicPriceList,
  PublicRoute,
  PublicVendor,
} from "@/lib/actions/transport.action";
import { formatAmount } from "@/lib/format";
import { inputClass } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  Bus,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Copy,
  Info,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const SERVICE_FEE = 0;

const HALLS = [
  "Joseph Hall",
  "Paul Hall",
  "Peter Hall",
  "Daniel Hall",
  "John Hall",
  "Joshua Hall",
  "Lydia Hall",
  "Mary Hall",
  "Deborah Hall",
  "Dorcas Hall",
] as const;

const passengerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  hall: z.enum(HALLS, { error: "Please select your hall" }),
  roomNumber: z
    .string()
    .min(1, "Room number is required")
    .refine((v) => /^[A-H][1-4](0[1-9]|1[0-3])$/i.test(v.trim()), {
      message: "Invalid format — e.g. E401, A113 (rooms 01\u201313 per floor)",
    }),
  phone: z.string().regex(/^\d{11}$/, "Must be exactly 11 digits"),
  parentsPhone: z.string().regex(/^\d{11}$/, "Must be exactly 11 digits"),
  destinationAddress: z
    .string()
    .min(5, "Please enter a complete address")
    .max(200, "Max 200 characters")
    .trim(),
  studentNotes: z.string().max(300, "Max 300 characters").optional(),
});

type PassengerValues = z.infer<typeof passengerSchema>;

type Step =
  | "pick-destination"
  | "ride-summary"
  | "passenger-details"
  | "success";

const STEP_BACK: Partial<Record<Step, Step>> = {
  "ride-summary": "pick-destination",
  "passenger-details": "ride-summary",
};

const STEP_TITLE: Record<Step, string> = {
  "pick-destination": "Pick Destination",
  "ride-summary": "Ride Summary",
  "passenger-details": "Your Details",
  success: "Booking Confirmed!",
};

export default function BookingFlow({
  vendor,
  priceList,
  open,
  onClose,
  initialRoute,
  user,
  onOpenTopUp,
}: {
  vendor: PublicVendor;
  priceList: PublicPriceList;
  open: boolean;
  onClose: () => void;
  initialRoute?: PublicRoute | null;
  user: { id: string; name: string; phone: string; email: string };
  onOpenTopUp: (prefill: number, onSuccess: () => void) => void;
}) {
  const isLeaving = priceList.direction === "LEAVING";
  const directionLabel = isLeaving ? "Leaving School" : "Returning to School";

  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(
    initialRoute ? "ride-summary" : "pick-destination",
  );
  const [search, setSearch] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<PublicRoute | null>(
    initialRoute ?? null,
  );
  const [bookingRef, setBookingRef] = useState("");
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [shortfall, setShortfall] = useState<number | null>(null);
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(
    null,
  );
  const {
    register,
    control,
    handleSubmit,
    reset: resetForm,
    getValues,
    formState: { errors },
  } = useForm<PassengerValues>({
    resolver: zodResolver(passengerSchema),
    mode: "onChange",
    defaultValues: {
      name: user.name,
      hall: undefined,
      roomNumber: "",
      phone: user.phone,
      parentsPhone: "",
      destinationAddress: "",
    },
  });

  const filteredRoutes = useMemo(() => {
    if (!search.trim()) return priceList.routes;
    const q = search.toLowerCase();
    return priceList.routes.filter((r) => r.name.toLowerCase().includes(q));
  }, [search, priceList.routes]);

  // With a single departure there's nothing to choose — preselect it.
  useEffect(() => {
    if (priceList.departureTimes.length === 1) {
      setSelectedDeparture(priceList.departureTimes[0].departsAt);
    }
  }, [priceList.departureTimes]);

  function handleClose() {
    if (isProcessing) return;
    setStep("pick-destination");
    setSearch("");
    setSelectedRoute(null);
    setSelectedDeparture(null);
    setBookingRef("");
    setCopied(false);
    setIsProcessing(false);
    setSubmitError("");
    setShortfall(null);
    resetForm({
      name: user.name,
      hall: undefined,
      roomNumber: "",
      phone: user.phone,
      parentsPhone: "",
    });
    onClose();
  }

  function handleSelectRoute(route: PublicRoute) {
    setSelectedRoute(route);
    setStep("ride-summary");
  }

  function handleCopyRef() {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const basePrice = selectedRoute?.price ?? 0;
  const totalAmount = basePrice + SERVICE_FEE;
  const pickup = isLeaving
    ? "Covenant University"
    : (selectedRoute?.name ?? "");
  const destination = isLeaving
    ? (selectedRoute?.name ?? "")
    : "Covenant University";

  async function submitBooking(values: PassengerValues) {
    if (!selectedRoute) return;
    setSubmitError("");
    setShortfall(null);
    setIsProcessing(true);

    try {
      const result = await payBookingFromWallet({
        vendorId: vendor.id,
        routeId: selectedRoute.id,
        direction: priceList.direction,
        passengerName: values.name,
        passengerPhone: values.phone,
        parentsPhone: values.parentsPhone,
        hall: values.hall,
        roomNumber: values.roomNumber.trim().toUpperCase(),
        routeName: selectedRoute.name,
        fare: basePrice,
        serviceFee: SERVICE_FEE,
        studentNotes: values.studentNotes,
        destinationAddress: values.destinationAddress,
        departureAt: selectedDeparture ?? undefined,
      });

      if ("error" in result) {
        if (result.error === "INSUFFICIENT_BALANCE" && "shortfall" in result) {
          setShortfall(result.shortfall);
        } else {
          setSubmitError(result.error);
        }
        setIsProcessing(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setBookingRef(result.reference);
      setStep("success");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  const onPassengerSubmit = handleSubmit(submitBooking);

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
              {STEP_BACK[step] && !isProcessing && (
                <button
                  onClick={() => setStep(STEP_BACK[step]!)}
                  className="w-8 h-8 rounded-lg bg-portal-bg border border-portal-border flex items-center justify-center hover:bg-portal-bg2 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-[15px] font-bold truncate">
                  {STEP_TITLE[step]}
                </h3>
                <p className="text-[11px] text-portal-muted truncate">
                  {vendor.transportName} · {directionLabel}
                </p>
              </div>
              {!isProcessing && (
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-portal-bg border border-portal-border flex items-center justify-center hover:bg-portal-bg2 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

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
                            &#x20A6;{route.price.toLocaleString()}
                          </p>
                          <ArrowRight className="w-4 h-4 text-portal-muted flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === "ride-summary" && selectedRoute && (
                  <motion.div
                    key="step-summary"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
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

                    {priceList.departureTimes.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <CalendarClock className="w-3.5 h-3.5 text-portal-muted" />
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-portal-muted">
                            {priceList.departureTimes.length === 1
                              ? "Departure time"
                              : "Choose your departure time"}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {priceList.departureTimes.map((d, i) => {
                            const isSelected =
                              selectedDeparture === d.departsAt;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() =>
                                  setSelectedDeparture(d.departsAt)
                                }
                                className={`w-full flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                                  isSelected
                                    ? "border-portal-accent bg-portal-accent/5"
                                    : "border-portal-border bg-portal-bg hover:border-portal-accent/50"
                                }`}
                              >
                                <span
                                  className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isSelected
                                      ? "border-portal-accent"
                                      : "border-portal-border2"
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-portal-accent" />
                                  )}
                                </span>
                                <span
                                  className={`text-[13px] font-medium ${
                                    isSelected
                                      ? "text-portal-text"
                                      : "text-portal-text2"
                                  }`}
                                >
                                  {format(
                                    new Date(d.departsAt),
                                    "EEE d MMM · h:mm a",
                                  )}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-portal-accent ml-auto flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

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

                    <div className="bg-portal-bg rounded-xl p-4 mb-4 space-y-2">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-text2">Fare</span>
                        <span className="font-semibold">
                          &#x20A6;{basePrice.toLocaleString()}
                        </span>
                      </div>
                      {/* <div className="flex justify-between text-[13px]">
                        <span className="text-portal-text2">Service fee</span>
                        <span className="font-semibold">
                          &#x20A6;{SERVICE_FEE.toLocaleString()}
                        </span>
                      </div> */}
                      <div className="flex justify-between text-[14px] pt-2 border-t border-portal-border">
                        <span className="font-bold">Total</span>
                        <span className="font-heading font-extrabold text-base">
                          {formatAmount(totalAmount)}
                        </span>
                      </div>
                    </div>

                    {priceList.departureTimes.length > 0 &&
                      !selectedDeparture && (
                        <p className="text-[12px] text-portal-muted text-center mb-2">
                          Select a departure time to continue
                        </p>
                      )}
                    <button
                      onClick={() => setStep("passenger-details")}
                      disabled={
                        priceList.departureTimes.length > 0 &&
                        !selectedDeparture
                      }
                      className="w-full py-3 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[14px] font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {step === "passenger-details" && (
                  <motion.div
                    key="step-passenger"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
                    <form
                      onSubmit={onPassengerSubmit}
                      noValidate
                      className="space-y-4"
                    >
                      <Field label="Full Name" error={errors.name?.message}>
                        <input
                          {...register("name")}
                          type="text"
                          placeholder="Your full name"
                          className={inputCls(!!errors.name)}
                        />
                      </Field>

                      <Field
                        label="Hall of Residence"
                        error={errors.hall?.message}
                      >
                        <div className="relative">
                          <select
                            {...register("hall")}
                            className={`${inputCls(!!errors.hall)} appearance-none pr-8`}
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

                      <Field
                        label="Room Number"
                        hint="Letter (A-H) + floor (1-4) + room (01-13) e.g. E401, A113"
                        error={errors.roomNumber?.message}
                      >
                        <Controller
                          name="roomNumber"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="e.g. E401"
                              maxLength={4}
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                              className={inputCls(!!errors.roomNumber)}
                            />
                          )}
                        />
                      </Field>

                      <Field
                        label="Your Phone Number"
                        error={errors.phone?.message}
                      >
                        <Controller
                          name="phone"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="tel"
                              inputMode="numeric"
                              placeholder="08012345678"
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 11),
                                )
                              }
                              className={inputCls(!!errors.phone)}
                            />
                          )}
                        />
                      </Field>

                      <Field
                        label="Parent / Guardian Phone"
                        error={errors.parentsPhone?.message}
                      >
                        <Controller
                          name="parentsPhone"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="tel"
                              inputMode="numeric"
                              placeholder="08012345678"
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 11),
                                )
                              }
                              className={inputCls(!!errors.parentsPhone)}
                            />
                          )}
                        />
                      </Field>

                      <Field
                        label={
                          isLeaving ? "Drop-off Address" : "Pickup Address"
                        }
                        hint={
                          isLeaving
                            ? "Exact address where you'll be dropped off"
                            : "Exact address where the vendor should pick you up"
                        }
                        error={errors.destinationAddress?.message}
                      >
                        <textarea
                          {...register("destinationAddress")}
                          placeholder={
                            isLeaving
                              ? "e.g. 12 Allen Avenue, Ikeja, Lagos"
                              : "e.g. 12 Allen Avenue, Ikeja, Lagos"
                          }
                          maxLength={200}
                          rows={2}
                          className={`${inputCls(!!errors.destinationAddress)} resize-none`}
                        />
                      </Field>

                      <Field
                        label={`Note to ${vendor.transportName}`}
                        hint="Optional — e.g. luggage details, special requests"
                      >
                        <textarea
                          {...register("studentNotes")}
                          placeholder="Add a note for the vendor…"
                          maxLength={300}
                          rows={3}
                          className="w-full px-3.5 py-2.5 bg-portal-bg border border-portal-border rounded-xl text-sm text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent transition-colors resize-none"
                        />
                      </Field>

                      {/* Insufficient balance warning */}
                      {shortfall !== null && (
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-amber-700">
                              You&apos;re ₦{shortfall.toLocaleString()} short
                            </p>
                            <p className="text-[11px] text-amber-600 mt-0.5">
                              Top up your wallet to complete this booking.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenTopUp(shortfall, () =>
                                submitBooking(getValues()),
                              )
                            }
                            className="flex-shrink-0 text-[12px] font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-800"
                          >
                            Top Up Now
                          </button>
                        </div>
                      )}

                      {submitError && (
                        <p className="text-[12px] text-red-500 text-center">
                          {submitError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-3 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[14px] font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Pay ${formatAmount(totalAmount)} from Wallet`
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ── Step 4: Success ── */}
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
                        A confirmation email has been sent to you
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
                            <span className="text-[10px] text-portal-green font-sans">
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
                        <span className="font-semibold text-right max-w-[60%]">
                          {pickup} &#x2192; {destination}
                        </span>
                      </div>
                      {selectedDeparture && (
                        <div className="flex justify-between text-[13px]">
                          <span className="text-portal-muted">Departure</span>
                          <span className="font-semibold text-right max-w-[60%]">
                            {format(
                              new Date(selectedDeparture),
                              "EEE d MMM · h:mm a",
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-[13px] pt-2 border-t border-portal-border">
                        <span className="font-bold">Total Paid</span>
                        <span className="font-heading font-extrabold text-base">
                          {formatAmount(totalAmount)}
                        </span>
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

const inputCls = (err?: any) => inputClass(err, "sm");

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
