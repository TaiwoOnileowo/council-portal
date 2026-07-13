"use client";

import DetailRow from "@/components/ui/DetailRow";
import Modal from "@/components/ui/Modal";
import { formatAmount } from "@/lib/format";
import { bookingStatusConfig } from "@/modules/dashboard/dashboard.constant";
import {
  formatDeparture,
  formatFullDate,
} from "@/modules/dashboard/dashboard.util";
import type { StudentBooking } from "@/modules/transport/transport.types";
import Image from "next/image";

type Props = {
  booking: StudentBooking | null;
  open: boolean;
  onClose: () => void;
};

export default function BookingDetailModal({ booking, open, onClose }: Props) {
  if (!booking) return null;

  const statusCfg = bookingStatusConfig(booking.status);
  const StatusIcon = statusCfg.icon;
  const totalAmount = booking.fare + booking.serviceFee;
  const directionLabel =
    booking.direction === "LEAVING" ? "Leaving school" : "Returning to school";

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
        <div className="flex items-center gap-3 mb-5 p-3.5 bg-portal-accent-bg/50 rounded-xl border border-portal-border">
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
          </div>
        </div>

        <div className="bg-portal-accent-bg/50 rounded-xl border border-portal-border px-4 mb-5">
          {booking.status === "CONFIRMED" && booking.vendor.phone && (
            <DetailRow
              label="Vendor phone"
              value={booking.vendor.phone}
              copyValue={booking.vendor.phone}
            />
          )}
          <DetailRow label="Route" value={booking.routeName} />
          <DetailRow label="Direction" value={directionLabel} />
          {booking.stopName && (
            <DetailRow
              label={
                booking.direction === "LEAVING" ? "Drop-off stop" : "Pickup stop"
              }
              value={booking.stopName}
            />
          )}
          {booking.destinationAddress && (
            <DetailRow
              label={
                booking.stopName
                  ? "Additional directions"
                  : booking.direction === "LEAVING"
                    ? "Drop-off address"
                    : "Pickup address"
              }
              value={booking.destinationAddress}
            />
          )}
          {booking.departureAt && (
            <DetailRow
              label="Departure"
              value={formatDeparture(booking.departureAt)}
            />
          )}
          <DetailRow
            label="Date booked"
            value={formatFullDate(booking.createdAt)}
          />
          <DetailRow label="Fare" value={formatAmount(booking.fare)} />
          <DetailRow
            label="Service fee"
            value={formatAmount(booking.serviceFee)}
          />
          <DetailRow
            label="Total paid"
            value={
              <span className="font-bold font-heading text-[14px]">
                {formatAmount(totalAmount)}
              </span>
            }
          />
        </div>

        {booking.studentNotes && (
          <div className="bg-portal-accent-bg/50 rounded-xl border border-portal-border p-4 mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1">
              Your Note to Vendor
            </p>
            <p className="text-[13px] text-portal-text">
              {booking.studentNotes}
            </p>
          </div>
        )}

        {(booking.route.priceList.luggagePolicy ||
          booking.route.priceList.notes) && (
          <div className="space-y-3 mb-5">
            {booking.route.priceList.luggagePolicy && (
              <div className="bg-portal-accent-bg/50 rounded-xl border border-portal-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1">
                  Luggage Policy
                </p>
                <p className="text-[13px] text-portal-text">
                  {booking.route.priceList.luggagePolicy}
                </p>
              </div>
            )}
            {booking.route.priceList.notes && (
              <div className="bg-portal-accent-bg/50 rounded-xl border border-portal-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-portal-muted mb-1">
                  Vendor Notes
                </p>
                <p className="text-[13px] text-portal-text">
                  {booking.route.priceList.notes}
                </p>
              </div>
            )}
          </div>
        )}

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
