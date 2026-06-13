"use client";

import { BorderBeam } from "@/components/ui/border-beam";
import { formatAmount } from "@/lib/format";
import {
  formatBookingDate,
  formatDeparture,
} from "@/modules/dashboard/dashboard.util";
import { useNextBooking } from "@/modules/transport/hooks/useNextBooking";
import { ArrowRight, Bus, MapPin } from "lucide-react";
import Link from "next/link";

export default function NextRideCard() {
  const { data: nextRide, isLoading } = useNextBooking();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-5 mb-6 animate-pulse">
        <div className="h-3 w-24 bg-portal-border rounded mb-4" />
        <div className="h-5 w-1/2 bg-portal-border rounded mb-2" />
        <div className="h-3.5 w-1/3 bg-portal-border rounded" />
      </div>
    );
  }

  if (!nextRide) {
    return (
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 mb-6 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-portal-accent-bg flex items-center justify-center flex-shrink-0">
          <Bus className="w-5 h-5 text-portal-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-portal-text">
            No upcoming rides
          </p>
          <p className="text-[12.5px] text-portal-muted mt-0.5">
            Book a ride with an approved campus vendor to get started.
          </p>
        </div>
        <Link
          href="/transport"
          className="flex items-center gap-1.5 px-4 py-2 bg-portal-accent text-white rounded-lg text-[13px] font-semibold hover:bg-portal-accent2 transition-colors flex-shrink-0"
        >
          Book a ride
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-portal-border bg-portal-surface p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-portal-muted">
          Your next ride
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-portal-accent-bg flex items-center justify-center flex-shrink-0">
          <Bus className="w-[22px] h-[22px] text-portal-accent" />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-[18px] font-bold text-portal-text truncate">
            {nextRide.vendor.transportName}
          </p>
          <div className="flex items-center gap-1.5 text-[13px] text-portal-text2 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-portal-muted flex-shrink-0" />
            <span className="truncate">
              {nextRide.routeName} ·{" "}
              {nextRide.direction === "LEAVING" ? "Leaving" : "Returning"} ·{" "}
              {nextRide.departureAt
                ? formatDeparture(nextRide.departureAt)
                : formatBookingDate(nextRide.createdAt)}
            </span>
          </div>
        </div>
        <p className="ml-auto font-heading text-[20px] font-extrabold text-portal-text flex-shrink-0">
          {formatAmount(nextRide.fare + nextRide.serviceFee)}
        </p>
      </div>
      <BorderBeam duration={15} size={100} />
    </div>
  );
}
