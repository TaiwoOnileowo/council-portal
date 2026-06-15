"use client";

import RangePicker from "@/components/ui/RangePicker";
import { getGreeting } from "@/lib/date";
import { useDateRange } from "@/lib/hooks/useDateRange";
import IncomingBookings from "@/modules/transport/components/IncomingBookings";
import StatCards from "@/modules/admin/components/StatCards";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";

export default function AdminDashboardPage() {
  const [range, setRange] = useDateRange();
  const { data: user } = useCurrentUser();
  const firstName = user?.firstName;
  return (
    <div>
      <div className="mb-7 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-[22px] sm:text-[26px] font-extrabold text-portal-text">
            {getGreeting()},{" "}
            <span className="text-portal-accent">{firstName}</span>
          </h1>
          <p className="text-[13px] text-portal-muted mt-0.5">
            Welcome to Council Portal Admin
          </p>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>

      <StatCards />

      <IncomingBookings />
    </div>
  );
}
