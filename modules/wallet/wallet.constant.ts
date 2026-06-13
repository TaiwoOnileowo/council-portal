import { ArrowDownLeft, ArrowUpRight, Banknote, Bus, Plus, RotateCcw, type LucideIcon } from "lucide-react";

type TransactionTypeConfig = {
  label: string;
  icon: LucideIcon;
};

const TRANSACTION_TYPE_CONFIG: Record<string, TransactionTypeConfig> = {
  topup: { label: "Wallet top-up", icon: Plus },
  booking: { label: "Transport booking", icon: Bus },
  refund: { label: "Refund", icon: RotateCcw },
  earning: { label: "Booking earning", icon: Banknote },
  payout: { label: "Withdrawal", icon: ArrowUpRight },
  payout_reversal: { label: "Withdrawal reversed", icon: RotateCcw },
};

export function transactionTypeConfig(type: string | null, difference: number) {
  if (type && TRANSACTION_TYPE_CONFIG[type]) return TRANSACTION_TYPE_CONFIG[type];

  const credit = difference >= 0;
  return {
    label: credit ? "Credit" : "Debit",
    icon: credit ? ArrowDownLeft : ArrowUpRight,
  };
}

export const TRANSACTION_TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All transactions" },
  { value: "topup", label: "Top-ups" },
  { value: "booking", label: "Bookings" },
  { value: "refund", label: "Refunds" },
];

export const VENDOR_TRANSACTION_TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All transactions" },
  { value: "earning", label: "Earnings" },
  { value: "payout", label: "Withdrawals" },
];
