import type { VendorBooking } from "@/modules/vendor/vendor.types";

const MAP: Record<VendorBooking["status"], { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-portal-gold-bg text-portal-gold" },
  CONFIRMED: { label: "Confirmed", cls: "bg-portal-green-bg text-portal-green" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-400" },
  FAILED: { label: "Failed", cls: "bg-red-50 text-red-400" },
};

export default function StatusBadge({ status }: { status: VendorBooking["status"] }) {
  const { label, cls } = MAP[status];
  return (
    <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}
