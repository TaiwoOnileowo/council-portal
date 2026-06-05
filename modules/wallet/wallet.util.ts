import { format, isToday, isYesterday } from "date-fns";
import { formatAmount } from "@/lib/format";

// Date + time for transaction rows, e.g. "Today, 8:00 AM" / "12 Mar, 8:00 AM"
export function formatTransactionDate(iso: string) {
  const d = new Date(iso);
  const day = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "d MMM yyyy");
  return `${day}, ${format(d, "h:mm a")}`;
}

// Signed kobo delta to a display string, e.g. "+₦5,000" / "−₦2,500"
export function formatSignedAmount(differenceKobo: number) {
  const sign = differenceKobo >= 0 ? "+" : "−";
  return `${sign}${formatAmount(Math.abs(differenceKobo) / 100)}`;
}
