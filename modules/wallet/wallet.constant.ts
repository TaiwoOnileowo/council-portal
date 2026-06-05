import { ArrowDownLeft, ArrowUpRight, Bus, Plus, RotateCcw, type LucideIcon } from "lucide-react";

type TransactionTypeConfig = {
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

const TRANSACTION_TYPE_CONFIG: Record<string, TransactionTypeConfig> = {
  topup: {
    label: "Wallet top-up",
    icon: Plus,
    iconBg: "bg-portal-green-bg",
    iconColor: "text-portal-green",
  },
  booking: {
    label: "Transport booking",
    icon: Bus,
    iconBg: "bg-portal-accent-bg",
    iconColor: "text-portal-accent",
  },
  refund: {
    label: "Refund",
    icon: RotateCcw,
    iconBg: "bg-portal-gold-bg",
    iconColor: "text-portal-gold",
  },
};

export function transactionTypeConfig(type: string | null, difference: number) {
  if (type && TRANSACTION_TYPE_CONFIG[type]) return TRANSACTION_TYPE_CONFIG[type];

  const credit = difference >= 0;
  return {
    label: credit ? "Credit" : "Debit",
    icon: credit ? ArrowDownLeft : ArrowUpRight,
    iconBg: credit ? "bg-portal-green-bg" : "bg-portal-accent-bg",
    iconColor: credit ? "text-portal-green" : "text-portal-accent",
  };
}

export const TRANSACTION_TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All transactions" },
  { value: "topup", label: "Top-ups" },
  { value: "booking", label: "Bookings" },
  { value: "refund", label: "Refunds" },
];
