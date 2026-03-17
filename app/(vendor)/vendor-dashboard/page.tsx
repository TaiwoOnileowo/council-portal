import AvailabilityToggle from "@/components/portal/vendor-dashboard/AvailabilityToggle";
import IncomingBookings from "@/components/portal/vendor-dashboard/IncomingBookings";
import RouteManagement from "@/components/portal/vendor-dashboard/RouteManagement";
import VendorDashboardHeader from "@/components/portal/vendor-dashboard/VendorDashboardHeader";

export default function VendorDashboardPage() {
  return (
    <>
      <VendorDashboardHeader />
      <AvailabilityToggle />
      {/* <EarningsSummary /> */}
      <IncomingBookings />
      <RouteManagement />
    </>
  );
}
