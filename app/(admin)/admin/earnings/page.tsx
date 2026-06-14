import { getAdminEarnings } from "@/lib/actions/admin.action";
import { formatAmount } from "@/lib/format";
import { BookOpen, TrendingUp } from "lucide-react";

export default async function AdminEarningsPage() {
  const result = await getAdminEarnings();
  const data = result.ok ? result.data : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-[22px] sm:text-[26px] font-extrabold text-portal-text">
          Earnings
        </h1>
        <p className="text-[13px] text-portal-muted mt-0.5">
          Platform commission from all confirmed bookings
        </p>
      </div>

      {!result.ok || !data ? (
        <div className="bg-portal-surface border border-portal-border rounded-2xl px-5 py-10 text-center text-[13px] text-red-400">
          Failed to load earnings
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
            <div className="bg-portal-surface border border-portal-border rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-portal-green-bg flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5 text-portal-green" strokeWidth={2} />
                </div>
                <p className="text-[12.5px] text-portal-muted font-medium">
                  Total Commission Earned
                </p>
              </div>
              <p className="font-heading text-[32px] font-extrabold text-portal-text leading-none">
                {formatAmount(data.totalCommissionNaira)}
              </p>
              <p className="text-[11.5px] text-portal-muted mt-1.5">
                From all time confirmed bookings
              </p>
            </div>

            <div className="bg-portal-surface border border-portal-border rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-portal-blue-bg flex items-center justify-center">
                  <BookOpen className="w-4.5 h-4.5 text-portal-blue" strokeWidth={2} />
                </div>
                <p className="text-[12.5px] text-portal-muted font-medium">
                  Total Confirmed Bookings
                </p>
              </div>
              <p className="font-heading text-[32px] font-extrabold text-portal-text leading-none">
                {data.totalBookings.toLocaleString()}
              </p>
              <p className="text-[11.5px] text-portal-muted mt-1.5">
                Across all vendors
              </p>
            </div>
          </div>

          {/* By vendor breakdown */}
          <div className="bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-portal-border">
              <h2 className="font-heading text-[15px] font-bold text-portal-text">
                Commission by Vendor
              </h2>
            </div>
            {data.byVendor.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-portal-muted">
                No commission earned yet
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-portal-border bg-portal-accent-bg/50">
                        {["Vendor", "Confirmed Bookings", "Commission Earned", "Share"].map(
                          (h) => (
                            <th
                              key={h}
                              className="text-left text-[11px] font-semibold text-portal-muted uppercase tracking-wide px-5 py-3"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.byVendor.map((v) => {
                        const share =
                          data.totalCommissionNaira > 0
                            ? (v.commissionNaira / data.totalCommissionNaira) * 100
                            : 0;
                        return (
                          <tr
                            key={v.vendorId}
                            className="border-b border-portal-border last:border-b-0 hover:bg-portal-accent-bg/30 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <p className="text-[13px] font-semibold text-portal-text">
                                {v.businessName}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] text-portal-text2">
                              {v.bookingCount.toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-[13px] font-semibold text-portal-green">
                              {formatAmount(v.commissionNaira)}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-portal-border rounded-full overflow-hidden max-w-[80px]">
                                  <div
                                    className="h-full bg-portal-green rounded-full"
                                    style={{ width: `${share}%` }}
                                  />
                                </div>
                                <span className="text-[11.5px] text-portal-muted shrink-0">
                                  {share.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-portal-border">
                  {data.byVendor.map((v) => {
                    const share =
                      data.totalCommissionNaira > 0
                        ? (v.commissionNaira / data.totalCommissionNaira) * 100
                        : 0;
                    return (
                      <div key={v.vendorId} className="px-4 py-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[13px] font-semibold text-portal-text">
                            {v.businessName}
                          </p>
                          <p className="text-[13px] font-semibold text-portal-green">
                            {formatAmount(v.commissionNaira)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-portal-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-portal-green rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-portal-muted shrink-0">
                            {v.bookingCount} bookings · {share.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
