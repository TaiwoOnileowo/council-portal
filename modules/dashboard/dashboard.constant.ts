import { BadgeCheck, Clock, XCircle, type LucideIcon } from "lucide-react";
import type { StudentBooking } from "@/modules/transport/transport.types";

type BookingStatus = StudentBooking["status"];

type BookingStatusConfig = {
  label: string;
  color: string;
  icon: LucideIcon;
  className: string;
};

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, BookingStatusConfig> = {
  CONFIRMED: {
    label: "Confirmed",
    color: "#2a7d4f",
    icon: BadgeCheck,
    className: "text-portal-green bg-portal-green-bg",
  },
  PENDING: {
    label: "Pending",
    color: "#c9952a",
    icon: Clock,
    className: "text-portal-gold bg-portal-gold-bg",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#ef4444",
    icon: XCircle,
    className: "text-red-500 bg-red-50",
  },
  FAILED: {
    label: "Failed",
    color: "#ef4444",
    icon: XCircle,
    className: "text-red-500 bg-red-50",
  },
};

export function bookingStatusConfig(status: BookingStatus) {
  return BOOKING_STATUS_CONFIG[status] ?? BOOKING_STATUS_CONFIG.CONFIRMED;
}
