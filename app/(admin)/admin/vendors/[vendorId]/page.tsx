import { getAdminVendorDetail } from "@/lib/actions/admin.action";
import { formatAmount } from "@/lib/format";
import AdminVendorToggle from "@/modules/admin/components/AdminVendorToggle";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminVendorDetailPage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const { vendorId } = await params;
  const result = await getAdminVendorDetail(vendorId);
  if (!result.ok) notFound();

  const { data: v } = result;

  return (
    <div>
      <Link
        href="/admin/vendors"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-portal-muted hover:text-portal-text mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to vendors
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-portal-purple-bg flex items-center justify-center shrink-0">
            <span className="text-[16px] font-extrabold text-portal-purple">
              {v.businessName.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="font-heading text-[22px] font-extrabold text-portal-text">
              {v.businessName}
            </h1>
            <p className="text-[12.5px] text-portal-muted">
              {v.ownerName} · {v.email} · {v.phone}
            </p>
            {v.tagline && (
              <p className="text-[12px] text-portal-text2 mt-0.5 italic">
                {v.tagline}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              v.isActive
                ? "bg-portal-green-bg text-portal-green"
                : "bg-portal-border text-portal-muted"
            }`}
          >
            {v.isActive ? "Active" : "Inactive"}
          </span>
          <AdminVendorToggle vendorId={v.userId} initialIsActive={v.isActive} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-portal-surface border border-portal-border rounded-2xl p-4">
          <p className="text-[11.5px] text-portal-muted mb-1">Total fare generated</p>
          <p className="font-heading text-[22px] font-extrabold text-portal-text">
            {formatAmount(v.totalFareNaira)}
          </p>
        </div>
        <div className="bg-portal-surface border border-portal-border rounded-2xl p-4">
          <p className="text-[11.5px] text-portal-muted mb-1">Commission to council</p>
          <p className="font-heading text-[22px] font-extrabold text-portal-green">
            {formatAmount(v.totalCommissionNaira)}
          </p>
        </div>
        <div className="bg-portal-surface border border-portal-border rounded-2xl p-4">
          <p className="text-[11.5px] text-portal-muted mb-1">Confirmed bookings</p>
          <p className="font-heading text-[22px] font-extrabold text-portal-text">
            {v.confirmedBookings.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-portal-border">
            <h2 className="font-heading text-[15px] font-bold text-portal-text">
              Recent Bookings
            </h2>
          </div>
          {v.recentBookings.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-portal-muted">
              No bookings yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-portal-border bg-portal-accent-bg/50">
                    {["Student", "Route", "Fare", "Commission", "Status", "Date"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left text-[11px] font-semibold text-portal-muted uppercase tracking-wide px-4 py-2.5"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {v.recentBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-portal-border last:border-b-0 hover:bg-portal-accent-bg/30"
                    >
                      <td className="px-4 py-3">
                        <p className="text-[12.5px] font-semibold text-portal-text">
                          {b.passengerName}
                        </p>
                        <p className="text-[10.5px] font-mono text-portal-muted/60">
                          {b.reference}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-portal-text2">
                        {b.routeName}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-portal-text">
                        {formatAmount(b.fare)}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-portal-green font-medium">
                        {b.commission > 0 ? formatAmount(b.commission) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-[12px] text-portal-muted">
                        {format(new Date(b.createdAt), "MMM d")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: info + price lists */}
        <div className="space-y-4">
          {/* Bank details */}
          <div className="bg-portal-surface border border-portal-border rounded-2xl p-4">
            <h3 className="font-heading text-[13px] font-bold text-portal-text mb-3">
              Bank Details
            </h3>
            {v.bankLinked ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-portal-green shrink-0" />
                <div>
                  <p className="text-[12.5px] font-semibold text-portal-text">
                    {v.bankName}
                  </p>
                  <p className="text-[11px] text-portal-muted">{v.accountMask}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-portal-muted shrink-0" />
                <p className="text-[12.5px] text-portal-muted">
                  No bank details added
                </p>
              </div>
            )}
          </div>

          {/* Price lists */}
          <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-portal-border">
              <h3 className="font-heading text-[13px] font-bold text-portal-text">
                Price Lists
              </h3>
            </div>
            {v.priceLists.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-portal-muted">
                No price lists
              </div>
            ) : (
              <div className="divide-y divide-portal-border">
                {v.priceLists.map((pl) => (
                  <div
                    key={pl.id}
                    className="px-4 py-3 flex items-center gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-portal-accent-bg flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-portal-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-portal-text">
                        {pl.direction.charAt(0) +
                          pl.direction.slice(1).toLowerCase()}
                      </p>
                      <p className="text-[11px] text-portal-muted">
                        {pl.routeCount} route{pl.routeCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <AvailBadge type={pl.availabilityType} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {v.description && (
            <div className="bg-portal-surface border border-portal-border rounded-2xl p-4">
              <h3 className="font-heading text-[13px] font-bold text-portal-text mb-2">
                About
              </h3>
              <p className="text-[12.5px] text-portal-text2 leading-relaxed">
                {v.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONFIRMED: "bg-portal-green-bg text-portal-green",
    CANCELLED: "bg-red-50 text-red-500",
    FAILED: "bg-red-50 text-red-500",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-portal-accent-bg text-portal-muted"}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function AvailBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-portal-green-bg text-portal-green",
    INACTIVE: "bg-portal-border text-portal-muted",
    SCHEDULED: "bg-portal-gold-bg text-portal-gold",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${map[type] ?? ""}`}
    >
      {type.charAt(0) + type.slice(1).toLowerCase()}
    </span>
  );
}
