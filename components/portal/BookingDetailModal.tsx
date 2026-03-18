"use client";

import Image from "next/image";
import { MapPin, Clock, Calendar, BadgeCheck, XCircle, Phone } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { StudentBooking } from "@/lib/hooks/useBookings";

type Props = {
  booking: StudentBooking | null;
  open: boolean;
  onClose: () => void;
};

const STATUS_CONFIG = {
  CONFIRMED: { label: "Confirmed", icon: BadgeCheck, className: "text-portal-green bg-portal-green-bg" },
  PENDING: { label: "Pending", icon: Clock, className: "text-portal-gold bg-portal-gold-bg" },
  CANCELLED: { label: "Cancelled", icon: XCircle, className: "text-red-500 bg-red-50" },
  FAILED: { label: "Failed", icon: XCircle, className: "text-red-500 bg-red-50" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(naira: number) {
  return `₦${naira.toLocaleString()}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-portal-border last:border-b-0">
      <span className="text-[12.5px] text-portal-muted flex-shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-portal-text text-right">{value}</span>
    </div>
  );
}

export default function BookingDetailModal({ booking, open, onClose }: Props) {
  if (!booking) return null;

  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.CONFIRMED;
  const StatusIcon = statusCfg.icon;
  const totalAmount = booking.fare + booking.serviceFee;
  const directionLabel = booking.direction === "LEAVING" ? "Leaving school" : "Returning to school";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Booking Details"
      description={booking.reference}
      maxWidth="max-w-[460px]"
    >
      <div className="px-5 py-4">
        {/* Status badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-5 ${statusCfg.className}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusCfg.label}
        </div>

        {/* Vendor */}
        <div className="flex items-center gap-3 mb-5 p-3.5 bg-portal-bg rounded-xl border border-portal-border">
          {booking.vendor.image ? (
            <Image
              src={booking.vendor.image}
              alt={booking.vendor.transportName}
              width={40}
              height={40}
              className="rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-[13px] font-bold text-blue-700 flex-shrink-0">
              {booking.vendor.transportName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-portal-text truncate">
              {booking.vendor.transportName}
            </p>
            {booking.vendor.phone && (
              <a
                href={`https://wa.me/234${booking.vendor.phone.replace(/^0/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-portal-accent mt-0.5 hover:underline"
              >
                <Phone className="w-3 h-3" />
                Contact on WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="bg-portal-bg rounded-xl border border-portal-border px-4 mb-5">
          <Row
            label="Route"
            value={
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
                {booking.routeName}
              </span>
            }
          />
          <Row label="Direction" value={directionLabel} />
          <Row
            label="Date booked"
            value={
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
                {formatDate(booking.createdAt)}
              </span>
            }
          />
          <Row label="Fare" value={formatAmount(booking.fare)} />
          <Row label="Service fee" value={formatAmount(booking.serviceFee)} />
          <Row
            label="Total paid"
            value={
              <span className="font-bold font-heading text-[14px]">{formatAmount(totalAmount)}</span>
            }
          />
        </div>

        {/* Luggage & Notes */}
        {(booking.route.priceList.luggagePolicy || booking.route.priceList.notes) && (
          <div className="space-y-3 mb-5">
            {booking.route.priceList.luggagePolicy && (
              <div className="bg-portal-bg rounded-xl border border-portal-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1">
                  Luggage Policy
                </p>
                <p className="text-[13px] text-portal-text">{booking.route.priceList.luggagePolicy}</p>
              </div>
            )}
            {booking.route.priceList.notes && (
              <div className="bg-portal-bg rounded-xl border border-portal-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1">
                  Vendor Notes
                </p>
                <p className="text-[13px] text-portal-text">{booking.route.priceList.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Reference */}
        <div className="text-center py-2">
          <p className="text-[11px] text-portal-muted">Booking reference</p>
          <p className="text-[13px] font-mono font-bold text-portal-text mt-0.5 tracking-wider">
            {booking.reference}
          </p>
        </div>
      </div>
    </Modal>
  );
}
