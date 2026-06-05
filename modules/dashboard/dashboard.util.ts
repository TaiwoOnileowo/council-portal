import { format, isToday, isTomorrow } from "date-fns";

function relativeDay(d: Date, fallback: string) {
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, fallback);
}

// Short date for list rows, e.g. "Today" / "12 Mar"
export function formatBookingDate(iso: string) {
  return relativeDay(new Date(iso), "d MMM");
}

// Departure date + time, e.g. "Today, 8:00 AM" / "Sat 12 Mar, 8:00 AM"
export function formatDeparture(iso: string) {
  const d = new Date(iso);
  return `${relativeDay(d, "EEE d MMM")}, ${format(d, "h:mm a")}`;
}

// Full date for detail views, e.g. "Sat 12 Mar 2026"
export function formatFullDate(iso: string) {
  return format(new Date(iso), "EEE d MMM yyyy");
}
