"use client";

import Sidebar from "@/components/portal/Sidebar";
import VendorDashboardHeader from "@/components/portal/vendor-dashboard/VendorDashboardHeader";
import AvailabilityToggle from "@/components/portal/vendor-dashboard/AvailabilityToggle";
import EarningsSummary from "@/components/portal/vendor-dashboard/EarningsSummary";
import IncomingBookings from "@/components/portal/vendor-dashboard/IncomingBookings";
import RouteManagement from "@/components/portal/vendor-dashboard/RouteManagement";

export default function VendorDashboardPage() {
  return (
    <div className="flex min-h-screen bg-portal-bg">
      <Sidebar />
      <main className="ml-[260px] flex-1 px-10 py-8 max-w-[calc(100vw-260px)]">
        <VendorDashboardHeader />
        <AvailabilityToggle />
        <EarningsSummary />
        <IncomingBookings />
        <RouteManagement />
      </main>
    </div>
  );
}
