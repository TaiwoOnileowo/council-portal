import { getAdminBookings, getAdminVendorNames } from "@/lib/actions/admin.action";
import { formatAmount } from "@/lib/format";
import AdminBookingsFilters from "@/modules/admin/components/AdminBookingsFilters";
import AdminPagination from "@/modules/admin/components/AdminPagination";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";
import { Suspense } from "react";

const PAGE_SIZE = 25;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    vendor?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);

  const [bookingsResult, vendorsResult] = await Promise.all([
    getAdminBookings({
      page,
      vendorId: params.vendor ?? "",
      status: params.status ?? "",
      dateFrom: params.dateFrom ?? "",
      dateTo: params.dateTo ?? "",
      search: params.search ?? "",
    }),
    getAdminVendorNames(),
  ]);

  const bookings = bookingsResult.ok ? bookingsResult.data : [];
  const total = bookingsResult.ok ? bookingsResult.total : 0;
  const totalFare = bookingsResult.ok ? bookingsResult.totalFareNaira : 0;
  const totalCommission = bookingsResult.ok ? bookingsResult.totalCommissionNaira : 0;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const vendors = vendorsResult.ok ? vendorsResult.data : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-[22px] sm:text-[26px] font-extrabold text-portal-text">
          Bookings
        </h1>
        <p className="text-[13px] text-portal-muted mt-0.5">
          {total} booking{total !== 1 ? "s" : ""} ·{" "}
          <span className="text-portal-text2 font-medium">
            {formatAmount(totalFare)} total fare
          </span>{" "}
          ·{" "}
          <span className="text-portal-green font-medium">
            {formatAmount(totalCommission)} commission
          </span>
        </p>
      </div>

      <Suspense>
        <AdminBookingsFilters vendors={vendors} />
      </Suspense>

      <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
        {!bookingsResult.ok ? (
          <div className="px-5 py-10 text-center text-[13px] text-red-400">
            Failed to load bookings
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <BookOpen className="w-8 h-8 text-portal-muted mx-auto mb-2" />
            <p className="text-[13px] text-portal-muted">
              No bookings match your filters
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-portal-border bg-portal-accent-bg/50">
                    {[
                      "Student",
                      "Vendor",
                      "Route",
                      "Fare",
                      "Commission",
                      "Status",
                      "Date",
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
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-portal-border last:border-b-0 hover:bg-portal-accent-bg/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-[13px] font-semibold text-portal-text">
                          {b.passengerName}
                        </p>
                        <p className="text-[11px] text-portal-muted">
                          {b.passengerPhone}
                        </p>
                        <p className="text-[10.5px] font-mono text-portal-muted/60 mt-0.5">
                          {b.reference}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[12.5px] text-portal-text2">
                        {b.vendorName}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-[12.5px] text-portal-text2">
                          {b.routeName}
                        </p>
                        <p className="text-[11px] text-portal-muted capitalize">
                          {b.direction.toLowerCase()}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-portal-text">
                        {formatAmount(b.fare)}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-portal-green">
                        {b.commission > 0 ? formatAmount(b.commission) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-portal-muted">
                        {format(new Date(b.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-portal-border">
              {bookings.map((b) => (
                <div key={b.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-[13px] font-semibold text-portal-text">
                      {b.passengerName}
                    </p>
                    <StatusPill status={b.status} />
                  </div>
                  <p className="text-[11.5px] text-portal-muted">
                    {b.vendorName} · {b.routeName}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[12.5px] font-semibold text-portal-text">
                      {formatAmount(b.fare)}
                    </span>
                    {b.commission > 0 && (
                      <span className="text-[11px] text-portal-green font-medium">
                        +{formatAmount(b.commission)} comm.
                      </span>
                    )}
                    <span className="text-[11px] text-portal-muted ml-auto">
                      {format(new Date(b.createdAt), "MMM d")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Suspense>
        <AdminPagination page={page} pageCount={pageCount} />
      </Suspense>
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
