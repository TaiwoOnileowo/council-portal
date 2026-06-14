"use client";

import Modal from "@/components/ui/Modal";
import { verifyAndTopUpWallet } from "@/lib/actions/wallet.action";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, Loader2, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Step = "enter-amount" | "processing" | "success";

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: Record<string, unknown>) => void;
  }
}

const TAGLINES = [
  "Broke at the portal is not a vibe",
  "Top up once, ride anytime",
  "Because last-minute scrambling is so last semester",
];

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000, 200000];

function formatWithCommas(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

function parseAmount(value: string) {
  return parseInt(value.replace(/,/g, ""), 10) || 0;
}

export default function TopUpModal({
  open,
  onClose,
  prefilledAmount,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  prefilledAmount?: number;
  onSuccess?: () => void;
}) {
  const { data: currentUser } = useCurrentUser();
  const [step, setStep] = useState<Step>("enter-amount");
  const [amountInput, setAmountInput] = useState("");
  const [tagline] = useState(
    () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)],
  );
  const [txRef, setTxRef] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const paymentStatusRef = useRef<"idle" | "processing">("idle");

  const queryClient = useQueryClient();

  const { mutate: doVerify } = useMutation({
    mutationFn: ({
      transactionId,
      ref,
      amountKobo,
    }: {
      transactionId: number;
      ref: string;
      amountKobo: number;
    }) => verifyAndTopUpWallet({ transactionId, txRef: ref, amountKobo }),
    onSuccess: (data) => {
      if ("error" in data) {
        setVerifyError(data.error);
        setStep("enter-amount");
        paymentStatusRef.current = "idle";
        return;
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.wallet.all(currentUser?.id ?? ""),
      });
      setStep("success");
      paymentStatusRef.current = "idle";

      if (onSuccess) {
        setTimeout(() => {
          onClose();
          onSuccess();
        }, 1500);
      }
    },
  });

  // Load Flutterwave script
  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = document.querySelector(
      'script[src="https://checkout.flutterwave.com/v3.js"]',
    );
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Pre-fill and reset on open
  useEffect(() => {
    if (open) {
      setStep("enter-amount");
      setCopied(false);
      setVerifyError("");
      paymentStatusRef.current = "idle";

      if (prefilledAmount && prefilledAmount > 0) {
        setAmountInput(prefilledAmount.toLocaleString("en-NG"));
      } else {
        setAmountInput("");
        setTimeout(() => inputRef.current?.focus(), 300);
      }
    }
  }, [open, prefilledAmount]);

  const amountNaira = parseAmount(amountInput);
  const amountKobo = amountNaira * 100;
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmountInput(formatWithCommas(e.target.value));
  }

  function handleQuickSelect(naira: number) {
    setAmountInput(naira.toLocaleString("en-NG"));
  }
  function handlePay() {
    if (amountKobo <= 0) return;

    // eslint-disable-next-line react-hooks/purity
    const ref = `TOPUP-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;
    setTxRef(ref);
    setVerifyError("");
    paymentStatusRef.current = "idle";

    window.FlutterwaveCheckout?.({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: ref,
      amount: amountNaira,
      currency: "NGN",
      payment_options: "card,ussd,banktransfer",
      customer: {
        email: currentUser?.email ?? "",
        name: currentUser?.fullName ?? "",
      },
      meta: { userId: currentUser?.id },
      customizations: {
        title: "Council Portal Wallet",
        description: "Top up your wallet",
      },
      callback: (response: { status: string; transaction_id: number }) => {
        if (
          response.status === "successful" ||
          response.status === "completed"
        ) {
          paymentStatusRef.current = "processing";
          setStep("processing");
          doVerify({
            transactionId: response.transaction_id,
            ref,
            amountKobo,
          });
        } else {
          setVerifyError("Payment was not completed. Please try again.");
          paymentStatusRef.current = "idle";
        }
      },
      onclose: () => {
        // Only reset if payment wasn't initiated
        if (paymentStatusRef.current === "idle") {
          setVerifyError("");
        }
      },
    });
  }

  function handleCopyRef() {
    navigator.clipboard.writeText(txRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isResuming = step === "success" && !!onSuccess;

  return (
    <Modal
      open={open}
      onClose={step === "processing" ? () => {} : onClose}
      title={
        step === "enter-amount"
          ? "Top Up Wallet"
          : step === "processing"
            ? "Processing Payment"
            : "Top-Up Successful!"
      }
      description={step === "enter-amount" ? tagline : undefined}
    >
      <AnimatePresence mode="wait">
        {step === "enter-amount" && (
          <motion.div
            key="step-amount"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="p-5"
          >
            {prefilledAmount && prefilledAmount > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-[12px] text-amber-700">
                <span className="font-semibold">
                  You&apos;re ₦{prefilledAmount.toLocaleString()} short.{" "}
                </span>
                <span className="text-amber-600">
                  Top up at least this amount to continue.
                </span>
              </div>
            )}

            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-2">
                Amount (₦)
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-portal-muted text-sm font-semibold">
                  ₦
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amountInput}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-3.5 py-3 bg-portal-accent-bg/50 border border-portal-border rounded-xl text-[22px] font-heading font-extrabold text-portal-text placeholder:text-portal-muted/40 outline-none focus:border-portal-accent transition-colors"
                />
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-2">
                Quick Select
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickSelect(amount)}
                    className={`py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                      amountNaira === amount
                        ? "bg-portal-accent text-white border-portal-accent"
                        : "bg-portal-accent-bg/50 text-portal-text2 border-portal-border hover:border-portal-accent-border hover:bg-portal-bg2"
                    }`}
                  >
                    ₦{amount.toLocaleString("en-NG")}
                  </button>
                ))}
              </div>
            </div>

            {verifyError && (
              <p className="text-[12px] text-red-500 text-center mb-3">
                {verifyError}
              </p>
            )}

            <button
              onClick={() => handlePay()}
              disabled={amountKobo <= 0}
              className="w-full py-3 bg-portal-accent hover:bg-portal-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[14px] font-semibold transition-all hover:enabled:-translate-y-0.5"
            >
              {amountNaira > 0
                ? `Pay Now — ₦${amountNaira.toLocaleString("en-NG")}`
                : "Pay Now"}
            </button>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="step-processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-5 flex flex-col items-center justify-center py-16"
          >
            <Loader2 className="w-10 h-10 text-portal-accent animate-spin mb-5" />
            <p className="font-heading text-[15px] font-bold mb-1">
              Verifying payment...
            </p>
            <p className="text-[12px] text-portal-muted">
              Please wait, this will only take a moment
            </p>
          </motion.div>
        )}

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
                Wallet Topped Up!
              </h3>
              <p className="text-[12px] text-portal-muted text-center">
                ₦{amountNaira.toLocaleString("en-NG")} has been added to your
                wallet
              </p>
            </div>

            <div className="bg-portal-accent-bg/50 rounded-xl p-4 space-y-3 mb-4">
              <div className="flex justify-between text-[13px]">
                <span className="text-portal-muted">Reference</span>
                <button
                  onClick={handleCopyRef}
                  className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-portal-accent hover:underline"
                >
                  {txRef}
                  <Copy className="w-3 h-3" />
                  {copied && (
                    <span className="text-[10px] text-portal-green">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
              <div className="flex justify-between text-[13px] pt-2 border-t border-portal-border">
                <span className="font-bold">Amount Added</span>
                <span className="font-heading font-extrabold text-base text-portal-green">
                  +₦{amountNaira.toLocaleString("en-NG")}
                </span>
              </div>
            </div>

            {isResuming ? (
              <div className="flex items-center justify-center gap-2 py-3 text-[13px] text-portal-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                Resuming your booking...
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("enter-amount");
                    setAmountInput("");
                  }}
                  className="flex-1 py-2.5 bg-portal-accent-bg/50 border border-portal-border text-portal-text2 rounded-xl text-[13px] font-semibold hover:bg-portal-bg2 transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Top Up Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[13px] font-semibold transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
