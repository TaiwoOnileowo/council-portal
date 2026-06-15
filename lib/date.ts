import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { DateRange } from "./types";

export const RANGE_FORMAT = "yyyy-MM-dd";
const DEFAULT_SPAN_DAYS = 30;

export function toISODate(date: Date): string {
  return format(date, RANGE_FORMAT);
}
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function defaultRange(): DateRange {
  const today = new Date();
  return {
    from: toISODate(subDays(today, DEFAULT_SPAN_DAYS - 1)),
    to: toISODate(today),
  };
}

export function rangeSpanDays(range: DateRange): number {
  return differenceInCalendarDays(parseISO(range.to), parseISO(range.from));
}

export function formatRangeLabel(range: DateRange): string {
  const from = parseISO(range.from);
  const to = parseISO(range.to);
  const sameYear = from.getFullYear() === to.getFullYear();
  const left = format(from, sameYear ? "MMM d" : "MMM d, yyyy");
  const right = format(to, "MMM d, yyyy");
  return `${left} – ${right}`;
}
