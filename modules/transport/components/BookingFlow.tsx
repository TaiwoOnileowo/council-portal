"use client";

import {
  payBookingFromWallet,
  startBookingCheckout,
} from "@/lib/actions/booking.action";
import type {
  PublicPriceList,
  PublicRoute,
  PublicVendor,
} from "@/lib/actions/transport.action";
import { formatAmount, formatBalance } from "@/lib/format";
import { readLocalDraft, writeLocalDraft } from "@/hooks/useLocalStorageDraft";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { nairaToKobo } from "@/lib/money";
import { queryKeys } from "@/lib/query-keys";
import { useWalletBalance } from "@/modules/wallet/hooks/useWalletBalance";
import { inputClass } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Bus,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Copy,
  Info,
  Loader2,
  Phone,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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

type PassengerDraft = Pick<
  PassengerValues,
  "hall" | "roomNumber" | "parentsPhone" | "destinationAddress" | "studentNotes"
>;

function passengerDraftKey(userId: string) {
  return `passengerDraft:${userId}`;
}

type Step = "ride-summary" | "passenger-details" | "success";

const STEP_TITLE: Record<Step, string> = {
  "ride-summary": "Ride Summary",
  "passenger-details": "Your Details",
  success: "Booking Confirmed!",
};

export default function BookingFlow({
  vendor,
  priceList,
  route,
  open,
  onClose,
  onBack,
  user,
  serviceFee,
}: {
  vendor: PublicVendor;
  priceList: PublicPriceList;
  route: PublicRoute;
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  user: { id: string; name: string; phone: string; email: string };
  serviceFee: number;
}) {
  const { balanceKobo } = useWalletBalance();
  const isLeaving = priceList.direction === "LEAVING";
  const directionLabel = isLeaving ? "Leaving School" : "Returning to School";

  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("ride-summary");
  const [bookingRef, setBookingRef] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const { copied, copy: copyRef } = useCopyToClipboard();
  const { copied: phoneCopied, copy: copyPhone } = useCopyToClipboard();
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "online">(
    "wallet",
  );

  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(
    () =>
      priceList.departureTimes.length === 1
        ? priceList.departureTimes[0].departsAt
        : null,
  );
  const savedPassengerDraft = readLocalDraft<PassengerDraft>(
    passengerDraftKey(user.id),
  );

  const {
    register,
    control,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<PassengerValues>({
    resolver: zodResolver(passengerSchema),
    mode: "onChange",
    defaultValues: {
      name: user.name,
      hall: savedPassengerDraft?.hall,
      roomNumber: savedPassengerDraft?.roomNumber ?? "",
      phone: user.phone,
      parentsPhone: savedPassengerDraft?.parentsPhone ?? "",
      destinationAddress: savedPassengerDraft?.destinationAddress ?? "",
      studentNotes: savedPassengerDraft?.studentNotes,
    },
  });

  function handleClose() {
    if (isProcessing) return;
    setStep("ride-summary");
    setSelectedDeparture(null);
    setBookingRef("");
    setPaidAmount(0);
    setIsProcessing(false);
    setSubmitError("");
    setPaymentMethod("wallet");
    resetForm({
      name: user.name,
      hall: undefined,
      roomNumber: "",
      phone: user.phone,
      parentsPhone: "",
    });
    onClose();
  }

  function handleBack() {
    if (isProcessing) return;
    if (step === "passenger-details") {
      setStep("ride-summary");
      return;
    }
    onBack();
  }

  const basePrice = route.price;
  const walletTotal = basePrice;
  const onlineTotal = basePrice + serviceFee;
  const pickup = isLeaving ? "Covenant University" : route.name;
  const destination = isLeaving ? route.name : "Covenant University";

  const insufficientWallet =
    balanceKobo !== null && balanceKobo < nairaToKobo(walletTotal);
  const activeMethod: "wallet" | "online" = insufficientWallet
    ? "online"
    : paymentMethod;
  const totalAmount = activeMethod === "online" ? onlineTotal : walletTotal;

  function bookingIntent(values: PassengerValues) {
    return {
      vendorId: vendor.id,
      routeId: route.id,
      direction: priceList.direction,
      passengerName: values.name,
      passengerPhone: values.phone,
      parentsPhone: values.parentsPhone,
      hall: values.hall,
      roomNumber: values.roomNumber.trim().toUpperCase(),
      routeName: route.name,
      fare: basePrice,
      studentNotes: values.studentNotes,
      destinationAddress: values.destinationAddress,
      departureAt: selectedDeparture ?? undefined,
    };
  }

  function savePassengerDraft(values: PassengerValues) {
    writeLocalDraft<PassengerDraft>(passengerDraftKey(user.id), {
      hall: values.hall,
      roomNumber: values.roomNumber,
      parentsPhone: values.parentsPhone,
      destinationAddress: values.destinationAddress,
      studentNotes: values.studentNotes,
    });
  }

  async function submitWalletPayment(values: PassengerValues) {
    const result = await payBookingFromWallet(bookingIntent(values));

    if ("error" in result) {
      setSubmitError(result.error);
      setIsProcessing(false);
      return;
    }

    queryClient.invalidateQueries({
      queryKey: queryKeys.wallet.all(user.id),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.bookings.all(user.id),
    });
    savePassengerDraft(values);
    setBookingRef(result.reference);
    setPaidAmount(walletTotal);
    setStep("success");
    setIsProcessing(false);
  }

  const checkoutMutation = useMutation({
    mutationFn: (values: PassengerValues) =>
      startBookingCheckout(bookingIntent(values)),
    onSuccess: (result, values) => {
      if ("error" in result) {
        setSubmitError(result.error);
        setIsProcessing(false);
        return;
      }
      savePassengerDraft(values);
      window.location.href = result.authorizationUrl;
    },
    onError: () => {
      setSubmitError("Something went wrong. Please try again.");
      setIsProcessing(false);
    },
  });

  async function submitBooking(values: PassengerValues) {
    setSubmitError("");
    setIsProcessing(true);

    if (activeMethod === "online") {
      checkoutMutation.mutate(values);
      return;
    }

    try {
      await submitWalletPayment(values);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
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
              {step !== "success" && !isProcessing && (
                <button
                  onClick={handleBack}
                  className="w-8 h-8 rounded-lg bg-portal-accent-bg/50 border border-portal-border flex items-center justify-center hover:bg-portal-bg2 transition-colors"
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
                  className="w-8 h-8 rounded-lg bg-portal-accent-bg/50 border border-portal-border flex items-center justify-center hover:bg-portal-bg2 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === "ride-summary" && (
                  <motion.div
                    key="step-summary"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="p-5"
                  >
                    <div className="bg-portal-accent-bg/50 rounded-xl p-4 mb-4">
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
                        {route.capacity !== null && (
                          <div className="flex items-center gap-1.5 text-[12px] text-portal-text2">
                            <span className="text-portal-muted">·</span>
                            {route.capacity} seats
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
                                    : "border-portal-border bg-portal-accent-bg/50 hover:border-portal-accent/50"
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
                      <div className="mb-4 flex gap-2.5 bg-portal-accent-bg/50 border border-portal-border rounded-xl px-3.5 py-3">
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

                    <div className="bg-portal-accent-bg/50 rounded-xl p-4 mb-4">
                      <div className="flex justify-between text-[14px]">
                        <span className="font-bold">Fare</span>
                        <span className="font-heading font-extrabold text-base">
                          {formatAmount(basePrice)}
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
                            : "Exact address where you stay"
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
                          className="w-full px-3.5 py-2.5 bg-portal-accent-bg/50 border border-portal-border rounded-xl text-sm text-portal-text placeholder:text-portal-muted outline-none focus:border-portal-accent transition-colors resize-none"
                        />
                      </Field>

                      {/* Payment method */}
                      <div>
                        <p className="text-[12px] font-semibold text-portal-text2 mb-1.5">
                          Pay With
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("wallet")}
                            disabled={insufficientWallet}
                            className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              activeMethod === "wallet"
                                ? "border-portal-accent bg-portal-accent/5"
                                : "border-portal-border bg-portal-accent-bg/50 hover:border-portal-accent/50"
                            }`}
                          >
                            <p className="text-[12px] font-semibold text-portal-text">
                              Wallet Balance (Free)
                            </p>
                            <p className="text-[11px] text-portal-muted mt-0.5">
                              {formatBalance(balanceKobo)}
                              {insufficientWallet && " · insufficient"}
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("online")}
                            className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                              activeMethod === "online"
                                ? "border-portal-accent bg-portal-accent/5"
                                : "border-portal-border bg-portal-accent-bg/50 hover:border-portal-accent/50"
                            }`}
                          >
                            <p className="text-[12px] font-semibold text-portal-text">
                              Pay Online
                            </p>
                            <p className="text-[11px] text-portal-muted mt-0.5">
                              Card, bank transfer
                              {serviceFee > 0 &&
                                ` · +${formatAmount(serviceFee)} fee`}
                            </p>
                          </button>
                        </div>
                      </div>

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
                        ) : activeMethod === "online" ? (
                          `Pay ${formatAmount(totalAmount)} Online`
                        ) : (
                          `Pay ${formatAmount(totalAmount)} from Wallet`
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ── Step 4: Success ── */}
                {step === "success" && (
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

                    <div className="bg-portal-accent-bg/50 rounded-xl p-4 space-y-3 mb-4">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-portal-muted">Booking Ref</span>
                        <button
                          onClick={() => copyRef(bookingRef)}
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
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-portal-muted">Vendor Phone</span>
                        <button
                          onClick={() => copyPhone(vendor.phone)}
                          className="flex items-center gap-1.5 font-semibold text-portal-text hover:text-portal-accent transition-colors"
                        >
                          <Phone className="w-3 h-3 text-portal-muted" />
                          {vendor.phone}
                          <Copy className="w-3 h-3 text-portal-muted/60" />
                          {phoneCopied && (
                            <span className="text-[10px] text-portal-green">
                              Copied!
                            </span>
                          )}
                        </button>
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
                          {formatAmount(paidAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        className="flex-1 py-2.5 bg-portal-accent-bg/50 border border-portal-border text-portal-text2 rounded-xl text-[13px] font-semibold hover:bg-portal-bg2 transition-colors"
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
