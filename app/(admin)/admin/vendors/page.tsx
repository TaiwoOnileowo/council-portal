import { getAdminVendors } from "@/lib/actions/admin.action";
import { formatAmount } from "@/lib/format";
import AdminVendorToggle from "@/modules/admin/components/AdminVendorToggle";
import { CheckCircle2, Store, XCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminVendorsPage() {
  const result = await getAdminVendors();
  const vendors = result.ok ? result.data : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-[22px] sm:text-[26px] font-extrabold text-portal-text">
          Vendors
        </h1>
        <p className="text-[13px] text-portal-muted mt-0.5">
          {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} ·{" "}
          {vendors.filter((v) => v.isActive).length} active
        </p>
      </div>

      {!result.ok ? (
        <div className="bg-portal-surface border border-portal-border rounded-2xl px-5 py-10 text-center text-[13px] text-red-400">
          Failed to load vendors
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-2xl px-5 py-12 text-center">
          <Store className="w-8 h-8 text-portal-muted mx-auto mb-2" />
          <p className="text-[13px] text-portal-muted">No vendors yet</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-portal-border bg-portal-accent-bg/50">
                  {[
                    "Vendor",
                    "Category",
                    "Bank",
                    "Active",
                    "Bookings",
                    "Commission",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-portal-muted uppercase tracking-wide px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr
                    key={v.userId}
                    className="border-b border-portal-border last:border-b-0 hover:bg-portal-accent-bg/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold text-portal-text">
                        {v.businessName}
                      </p>
                      <p className="text-[11px] text-portal-muted">
                        {v.ownerName}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-portal-purple-bg text-portal-purple">
                        {v.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {v.bankLinked ? (
                        <CheckCircle2 className="w-4 h-4 text-portal-green" />
                      ) : (
                        <XCircle className="w-4 h-4 text-portal-muted" />
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <AdminVendorToggle
                        vendorId={v.userId}
                        initialIsActive={v.isActive}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-portal-text">
                      {v.bookingCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-portal-text">
                      {formatAmount(v.totalCommissionNaira)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/vendors/${v.userId}`}
                        className="text-[12px] font-semibold text-portal-accent hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {vendors.map((v) => (
              <Link
                key={v.userId}
                href={`/admin/vendors/${v.userId}`}
                className="bg-portal-surface border border-portal-border rounded-2xl px-4 py-4 flex items-center gap-3 block hover:border-portal-accent/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-portal-purple-bg flex items-center justify-center shrink-0">
                  <span className="text-[13px] font-bold text-portal-purple">
                    {v.businessName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-portal-text">
                    {v.businessName}
                  </p>
                  <p className="text-[11.5px] text-portal-muted truncate">
                    {v.ownerName} · {v.bookingCount} bookings ·{" "}
                    {formatAmount(v.totalCommissionNaira)} commission
                  </p>
                </div>
                {/* <div onClick={(e) => e.preventDefault()}>
                  <AdminVendorToggle
                    vendorId={v.userId}
                    initialIsActive={v.isActive}
                  />
                </div> */}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
