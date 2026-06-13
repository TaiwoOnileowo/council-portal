"use client";

import Modal from "@/components/ui/Modal";
import type { TransportBooking } from "@/modules/transport/transport.types";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

type Props = {
  booking: TransportBooking | null;
  open: boolean;
  onClose: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
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
          <Row label="Name" value={booking.passengerName} />
          <Row label="Phone" value={booking.passengerPhone} />
          <Row label="Guardian phone" value={booking.parentsPhone} />

          <Row label="Hall" value={booking.hall} />
          <Row label="Room" value={booking.roomNumber} />
        </div>

        <div className="bg-portal-bg rounded-xl border border-portal-border px-4">
          <Row label="Route" value={booking.routeName} />
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
            value={booking.destinationAddress ?? "-"}
          />
          {booking.departureAt && (
            <Row
              label="Departure"
              value={format(
                new Date(booking.departureAt),
                "EEE d MMM · h:mm a",
              )}
            />
          )}
          <Row
            label="Booked on"
            value={format(new Date(booking.createdAt), "MMM d, yyyy")}
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
