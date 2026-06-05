"use client";

import {
  MapPin,
  Phone,
  Home,
  Calendar,
  Clock,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import Modal from "@/components/ui/Modal";
import type { TransportBooking } from "@/modules/transport/transport.types";

type Props = {
  booking: TransportBooking | null;
  open: boolean;
  onClose: () => void;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-portal-border last:border-b-0">
      <span className="text-[12.5px] text-portal-muted flex-shrink-0">
        {label}
      </span>
      <span className="text-[13px] font-medium text-portal-text text-right">
        {value}
      </span>
    </div>
  );
}

export default function TransportBookingDetailModal({
  booking,
  open,
  onClose,
}: Props) {
  if (!booking) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Passenger Details"
      description={booking.reference}
      maxWidth="max-w-[440px]"
    >
      <div className="px-5 py-4 space-y-4">
        <div className="bg-portal-bg rounded-xl border border-portal-border px-4">
          <Row
            label="Name"
            value={
              <span className="font-semibold">{booking.passengerName}</span>
            }
          />
          <Row
            label="Phone"
            value={
              <a
                href={`tel:${booking.passengerPhone}`}
                className="inline-flex items-center gap-1.5 text-portal-accent hover:underline"
              >
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                {booking.passengerPhone}
              </a>
            }
          />
          <Row
            label="Guardian phone"
            value={
              <a
                href={`tel:${booking.parentsPhone}`}
                className="inline-flex items-center gap-1.5 text-portal-accent hover:underline"
              >
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                {booking.parentsPhone}
              </a>
            }
          />
          <Row
            label="Hall"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
                {booking.hall}
              </span>
            }
          />
          <Row label="Room" value={booking.roomNumber} />
        </div>

        <div className="bg-portal-bg rounded-xl border border-portal-border px-4">
          <Row
            label="Route"
            value={
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
                {booking.routeName}
              </span>
            }
          />
          <Row
            label="Direction"
            value={
              booking.direction === "LEAVING"
                ? "Leaving school"
                : "Returning to school"
            }
          />
          <Row
            label={
              booking.direction === "LEAVING"
                ? "Drop-off address"
                : "Pickup address"
            }
            value={
              booking.destinationAddress ? (
                <span className="inline-flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-portal-muted flex-shrink-0 mt-0.5" />
                  {booking.destinationAddress}
                </span>
              ) : (
                <span className="text-portal-muted">—</span>
              )
            }
          />
          {booking.departureAt && (
            <Row
              label="Departure"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
                  {format(new Date(booking.departureAt), "EEE d MMM · h:mm a")}
                </span>
              }
            />
          )}
          <Row
            label="Booked on"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
                {format(new Date(booking.createdAt), "MMM d, yyyy")}
              </span>
            }
          />
        </div>

        {booking.studentNotes && (
          <div className="bg-portal-bg rounded-xl border border-portal-border p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-portal-muted" />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-portal-muted">
                Note from Student
              </p>
            </div>
            <p className="text-[13px] text-portal-text leading-relaxed">
              {booking.studentNotes}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
