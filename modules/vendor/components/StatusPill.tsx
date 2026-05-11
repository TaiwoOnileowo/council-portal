import type { PriceListAvailability } from "@/modules/vendor/vendor.types";

export default function StatusPill({ availability }: { availability: PriceListAvailability }) {
  if (availability.type === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-portal-green-bg text-portal-green whitespace-nowrap flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-portal-green" />
        Active
      </span>
    );
  }
  if (availability.type === "inactive") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-portal-bg text-portal-muted whitespace-nowrap flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-portal-muted" />
        Inactive
      </span>
    );
  }
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 whitespace-nowrap flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      {fmt(availability.startDate)} – {fmt(availability.endDate)}
    </span>
  );
}
