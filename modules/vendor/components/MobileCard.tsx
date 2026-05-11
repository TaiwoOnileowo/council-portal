import { format } from "date-fns";
import type { VendorBooking } from "@/modules/vendor/vendor.types";
import DirectionBadge from "./DirectionBadge";
import StatusBadge from "./StatusBadge";

export default function MobileCard({
  booking,
  showStatus,
  onClick,
}: {
  booking: VendorBooking;
  showStatus: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3.5 flex items-start justify-between gap-3 hover:bg-portal-bg transition-colors text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-portal-text truncate">
          {booking.passengerName}
        </p>
        <p className="text-[11.5px] text-portal-muted mt-0.5">{booking.routeName}</p>
        <p className="text-[11px] text-portal-muted mt-0.5">
          {format(new Date(booking.createdAt), "MMM d, yyyy")}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <DirectionBadge direction={booking.direction} />
        {showStatus && <StatusBadge status={booking.status} />}
      </div>
    </button>
  );
}
