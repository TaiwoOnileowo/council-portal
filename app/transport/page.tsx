"use client";

import { useState } from "react";
import Sidebar from "@/components/portal/Sidebar";
import TransportHeader, {
  type Tab,
} from "@/components/portal/transport/TransportHeader";
import QuickBookBar from "@/components/portal/transport/QuickBookBar";
import TransportStats from "@/components/portal/transport/TransportStats";
import VendorCards from "@/components/portal/transport/VendorCards";
import SharedRides from "@/components/portal/transport/SharedRides";
import RecentTrips from "@/components/portal/transport/RecentTrips";

export default function TransportPage() {
  return (
    <div className="flex min-h-screen bg-portal-bg">
      <Sidebar />
      <main className="ml-[260px] flex-1 px-10 py-8 max-w-[calc(100vw-260px)]">
        <TransportHeader />
        <QuickBookBar />
        <TransportStats />

        <VendorCards />
        {/* <SharedRides /> */}
        <RecentTrips />
      </main>
    </div>
  );
}
