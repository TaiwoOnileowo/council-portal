"use client";

import Modal from "@/components/ui/Modal";
import DetailRow from "@/components/ui/DetailRow";
import type { TransportBooking } from "@/modules/transport/transport.types";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

type Props = {
  booking: TransportBooking | null;
  open: boolean;
  onClose: () => void;
};

export default function BookingDetailModal({
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
        <div className="bg-portal-accent-bg/50 rounded-xl border border-portal-border px-4">
          <DetailRow label="Name" value={booking.passengerName} />
          <DetailRow
            label="Phone"
            value={booking.passengerPhone}
            copyValue={booking.passengerPhone}
          />
          <DetailRow
            label="Guardian phone"
            value={booking.parentsPhone}
            copyValue={booking.parentsPhone}
          />

          <DetailRow label="Hall" value={booking.hall} />
          <DetailRow label="Room" value={booking.roomNumber} />
        </div>

        <div className="bg-portal-accent-bg/50 rounded-xl border border-portal-border px-4">
          <DetailRow label="Route" value={booking.routeName} />
          <DetailRow
            label="Direction"
            value={
              booking.direction === "LEAVING"
                ? "Leaving school"
                : "Returning to school"
            }
          />
          {booking.stopName && (
            <DetailRow
              label={
                booking.direction === "LEAVING" ? "Drop-off stop" : "Pickup stop"
              }
              value={booking.stopName}
            />
          )}
          <DetailRow
            label={
              booking.stopName
                ? "Additional directions"
                : booking.direction === "LEAVING"
                  ? "Drop-off address"
                  : "Pickup address"
            }
            value={booking.destinationAddress ?? "-"}
          />
          {booking.departureAt && (
            <DetailRow
              label="Departure"
              value={format(
                new Date(booking.departureAt),
                "EEE d MMM · h:mm a",
              )}
            />
          )}
          <DetailRow
            label="Booked on"
            value={format(new Date(booking.createdAt), "MMM d, yyyy")}
          />
        </div>

        {booking.studentNotes && (
          <div className="bg-portal-accent-bg/50 rounded-xl border border-portal-border p-4">
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
