"use client";

import Modal from "@/components/ui/Modal";
import { startTopUp } from "@/lib/actions/wallet.action";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

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
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [amountInput, setAmountInput] = useState("");
  const [tagline] = useState(
    () => TAGLINES[Math.floor(Math.random() * TAGLINES.length)],
  );
  const [verifyError, setVerifyError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: doStartTopUp, isPending: isStarting } = useMutation({
    mutationFn: (amountKobo: number) => startTopUp(amountKobo),
    onSuccess: (data) => {
      if ("error" in data) {
        setVerifyError(data.error);
        return;
      }
      window.location.href = data.authorizationUrl;
    },
    onError: (error: unknown) => {
      console.error("Error starting top-up:", error);
      setVerifyError("Could not start payment. Please try again.");
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const amountNaira = parseAmount(amountInput);
  const amountKobo = amountNaira * 100;
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmountInput(formatWithCommas(e.target.value));
  }

  function handleQuickSelect(naira: number) {
    setAmountInput(naira.toLocaleString("en-NG"));
  }

  function handlePay() {
    if (amountKobo <= 0 || isStarting) return;
    setVerifyError("");
    doStartTopUp(amountKobo);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Top Up Wallet"
      description={tagline}
    >
      <div className="p-5">
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
          onClick={handlePay}
          disabled={amountKobo <= 0 || isStarting}
          className="w-full py-3 bg-portal-accent hover:bg-portal-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[14px] font-semibold transition-all hover:enabled:-translate-y-0.5"
        >
          {isStarting
            ? "Redirecting..."
            : amountNaira > 0
              ? `Pay Now — ₦${amountNaira.toLocaleString("en-NG")}`
              : "Pay Now"}
        </button>
      </div>
    </Modal>
  );
}
