import { getAdminDashboardStats } from "@/lib/actions/admin.action";
import { formatAmount } from "@/lib/format";
import { format } from "date-fns";
import {
  BookOpen,
  GraduationCap,
  Store,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const result = await getAdminDashboardStats();
  if (!result.ok) redirect("/gate");
  const { data } = result;

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-heading text-[22px] sm:text-[26px] font-extrabold text-portal-text">
          Admin Dashboard
        </h1>
        <p className="text-[13px] text-portal-muted mt-0.5">
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatCard
          label="Students"
          value={data.totalStudents}
          icon={GraduationCap}
          href="/admin/users"
          color="blue"
        />
        <StatCard
          label="Vendors"
          value={`${data.activeVendors} / ${data.totalVendors}`}
          icon={Store}
          href="/admin/vendors"
          color="purple"
          sub="active"
        />
        <StatCard
          label="Bookings this month"
          value={data.bookingsThisMonth}
          icon={BookOpen}
          href="/admin/bookings"
          color="green"
        />
        <StatCard
          label="Total commission"
          value={formatAmount(data.totalCommissionNaira)}
          icon={TrendingUp}
          href="/admin/earnings"
          color="gold"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-portal-surface border border-portal-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-portal-border flex items-center justify-between">
            <h2 className="font-heading text-[15px] font-bold text-portal-text">
              Recent Bookings
            </h2>
            <Link
              href="/admin/bookings"
              className="text-[12px] text-portal-accent font-semibold hover:underline"
            >
              View all
            </Link>
          </div>
          {data.recentBookings.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-portal-muted">
              No bookings yet
            </div>
          ) : (
            <div className="divide-y divide-portal-border">
              {data.recentBookings.map((b) => (
                <div key={b.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-portal-text truncate">
                      {b.passengerName}
                    </p>
                    <p className="text-[11.5px] text-portal-muted truncate">
                      {b.vendorName} · {b.routeName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold text-portal-text">
                      {formatAmount(b.fare)}
                    </p>
                    {b.commission > 0 && (
                      <p className="text-[11px] text-portal-green font-medium">
                        +{formatAmount(b.commission)} comm.
                      </p>
                    )}
                  </div>
                  <BookingStatusPill status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  href: string;
  color: "blue" | "purple" | "green" | "gold";
  sub?: string;
}) {
  const colorMap = {
    blue: "bg-portal-blue-bg text-portal-blue",
    purple: "bg-portal-purple-bg text-portal-purple",
    green: "bg-portal-green-bg text-portal-green",
    gold: "bg-portal-gold-bg text-portal-gold",
  };

  return (
    <Link
      href={href}
      className="bg-portal-surface border border-portal-border rounded-2xl p-4 hover:border-portal-accent/30 transition-colors block"
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}
      >
        <Icon className="w-4.5 h-4.5" strokeWidth={2} />
      </div>
      <p className="text-[22px] font-extrabold font-heading text-portal-text leading-none">
        {value}
      </p>
      {sub && <p className="text-[11px] text-portal-muted mt-0.5">{sub}</p>}
      <p className="text-[12px] text-portal-muted mt-1">{label}</p>
    </Link>
  );
}

function BookingStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONFIRMED: "bg-portal-green-bg text-portal-green",
    CANCELLED: "bg-red-50 text-red-500",
    FAILED: "bg-red-50 text-red-500",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${map[status] ?? "bg-portal-accent-bg text-portal-muted"}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
