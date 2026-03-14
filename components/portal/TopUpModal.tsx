"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Copy, Wallet } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { topUpWallet } from "@/lib/actions/wallet.action";
import Modal from "@/components/ui/Modal";

type Step = "enter-amount" | "payment" | "success";

const TAGLINES = [
  "Broke at the gate is not a vibe",
  "Top up once, ride anytime",
  "Because last-minute scrambling is so last semester",
];

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 20000, 50000];

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
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("enter-amount");
  const [amountInput, setAmountInput] = useState("");
  const [tagline] = useState(
    () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)],
  );
  const [ref, setRef] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { mutate: doTopUp } = useMutation({
    mutationFn: (amountKobo: number) => topUpWallet(amountKobo),
    onSuccess: (data) => {
      if ("ref" in data && data.ref) {
        setRef(data.ref);
        queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
        setStep("success");
      }
    },
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("enter-amount");
      setAmountInput("");
      setRef("");
      setCopied(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

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
    setStep("payment");
    doTopUp(amountKobo);
  }

  function handleCopyRef() {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    onClose();
  }

  const taglineForHeader =
    step === "enter-amount" ? tagline : undefined;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        step === "enter-amount"
          ? "Top Up Wallet"
          : step === "payment"
            ? "Processing Payment"
            : "Top-Up Successful!"
      }
      description={taglineForHeader}
    >
      <AnimatePresence mode="wait">
        {/* Step 1: Enter Amount */}
        {step === "enter-amount" && (
          <motion.div
            key="step-amount"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="p-5"
          >
            {/* Amount input */}
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
                  className="w-full pl-8 pr-3.5 py-3 bg-portal-bg border border-portal-border rounded-xl text-[22px] font-heading font-extrabold text-portal-text placeholder:text-portal-muted/40 outline-none focus:border-portal-accent transition-colors"
                />
              </div>
            </div>

            {/* Quick-select suggestions */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-2">
                Quick Select
              </p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickSelect(amount)}
                    className={`py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                      amountNaira === amount
                        ? "bg-portal-accent text-white border-portal-accent"
                        : "bg-portal-bg text-portal-text2 border-portal-border hover:border-portal-accent-border hover:bg-portal-bg2"
                    }`}
                  >
                    ₦{amount.toLocaleString("en-NG")}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={amountKobo <= 0}
              className="w-full py-3 bg-portal-accent hover:bg-portal-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[14px] font-semibold transition-all hover:enabled:-translate-y-0.5"
            >
              {amountNaira > 0
                ? `Pay Now — ₦${amountNaira.toLocaleString("en-NG")}`
                : "Pay Now"}
            </button>
          </motion.div>
        )}

        {/* Step 2: Payment processing */}
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

        {/* Step 3: Success */}
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

            <div className="bg-portal-bg rounded-xl p-4 space-y-3 mb-4">
              <div className="flex justify-between text-[13px]">
                <span className="text-portal-muted">Reference</span>
                <button
                  onClick={handleCopyRef}
                  className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-portal-accent hover:underline"
                >
                  {ref}
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

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep("enter-amount");
                  setAmountInput("");
                }}
                className="flex-1 py-2.5 bg-portal-bg border border-portal-border text-portal-text2 rounded-xl text-[13px] font-semibold hover:bg-portal-bg2 transition-colors flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Top Up Again
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[13px] font-semibold transition-all"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
