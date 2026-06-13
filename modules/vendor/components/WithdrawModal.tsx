"use client";

import Modal from "@/components/ui/Modal";
import { requestPayout } from "@/lib/actions/payout.action";
import { formatAmount } from "@/lib/format";
import { MIN_PAYOUT_NAIRA, koboToNaira, nairaToKobo } from "@/lib/money";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function formatWithCommas(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

function parseAmount(value: string) {
  return parseInt(value.replace(/,/g, ""), 10) || 0;
}

export default function WithdrawModal({
  open,
  onClose,
  availableKobo,
  bankAccount,
}: {
  open: boolean;
  onClose: () => void;
  availableKobo: number;
  bankAccount: { name: string; accountName: string; mask: string } | null;
}) {
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setAmountInput("");
      setError("");
      setDone(false);
    }
  }, [open]);

  const amountNaira = parseAmount(amountInput);
  const amountKobo = nairaToKobo(amountNaira);
  const availableNaira = koboToNaira(availableKobo);

  const { mutate, isPending } = useMutation({
    mutationFn: () => requestPayout(amountKobo),
    onSuccess: (res) => {
      if ("error" in res) {
        setError(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["vendor-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["payout-history"] });
      setDone(true);
      toast.success("Withdrawal is on its way to your bank.");
    },
  });

  function handleSubmit() {
    setError("");
    if (amountKobo < nairaToKobo(MIN_PAYOUT_NAIRA)) {
      setError(`Minimum withdrawal is ${formatAmount(MIN_PAYOUT_NAIRA)}.`);
      return;
    }
    if (amountKobo > availableKobo) {
      setError("Amount exceeds your available balance.");
      return;
    }
    mutate();
  }

  return (
    <Modal
      open={open}
      onClose={isPending ? () => {} : onClose}
      title={done ? "Withdrawal Requested" : "Withdraw Earnings"}
      description={
        done ? undefined : `Available: ${formatAmount(availableNaira)}`
      }
    >
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
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
                {formatAmount(amountNaira)} on the way
              </h3>
              <p className="text-[12px] text-portal-muted text-center">
                Sent to {bankAccount?.name} {bankAccount?.mask}. It usually
                lands within minutes.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[13px] font-semibold transition-all"
            >
              Done
            </button>
          </motion.div>
        ) : !bankAccount ? (
          <motion.div
            key="no-bank"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5"
          >
            <p className="text-[13px] text-portal-text2 mb-4">
              Add your bank details before withdrawing. You can do that from
              your profile.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-portal-accent hover:bg-portal-accent2 text-white rounded-xl text-[13px] font-semibold transition-all"
            >
              Got it
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="enter"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="p-5"
          >
            <div className="mb-4 bg-portal-accent-bg/50 rounded-xl px-3.5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-portal-muted">Paying to</p>
                <p className="text-[13px] font-semibold text-portal-text">
                  {bankAccount.name} {bankAccount.mask}
                </p>
                <p className="text-[11px] text-portal-muted">
                  {bankAccount.accountName}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-portal-muted mb-2">
                Amount (₦)
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-portal-muted text-sm font-semibold">
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amountInput}
                  onChange={(e) =>
                    setAmountInput(formatWithCommas(e.target.value))
                  }
                  className="w-full pl-8 pr-3.5 py-3 bg-portal-accent-bg/50 border border-portal-border rounded-xl text-[22px] font-heading font-extrabold text-portal-text placeholder:text-portal-muted/40 outline-none focus:border-portal-accent transition-colors"
                />
              </div>
              <button
                onClick={() =>
                  setAmountInput(availableNaira.toLocaleString("en-NG"))
                }
                className="mt-2 text-[12px] font-semibold text-portal-accent hover:underline"
              >
                Withdraw all — {formatAmount(availableNaira)}
              </button>
            </div>

            {error && (
              <p className="text-[12px] text-red-500 text-center mb-3">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending || amountKobo <= 0}
              className="w-full py-3 bg-portal-accent hover:bg-portal-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[14px] font-semibold transition-all hover:enabled:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {amountNaira > 0
                ? `Withdraw ${formatAmount(amountNaira)}`
                : "Withdraw"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
