"use client";

import PageHeader from "@/components/ui/PageHeader";
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
      <PageHeader
        className="mb-7"
        title={
          <>
            {getGreeting()}, <span className="text-portal-accent">{firstName}</span>
          </>
        }
        subtitle="Welcome to Council Portal Admin"
        actions={<RangePicker value={range} onChange={setRange} />}
      />

      <StatCards />

      <IncomingBookings />
    </div>
  );
}
