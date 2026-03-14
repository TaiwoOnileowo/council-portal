import VendorDashboardHeader from "@/components/portal/vendor-dashboard/VendorDashboardHeader";
import AvailabilityToggle from "@/components/portal/vendor-dashboard/AvailabilityToggle";
import EarningsSummary from "@/components/portal/vendor-dashboard/EarningsSummary";
import IncomingBookings from "@/components/portal/vendor-dashboard/IncomingBookings";
import RouteManagement from "@/components/portal/vendor-dashboard/RouteManagement";

export default function VendorDashboardPage() {
  return (
    <>
      <VendorDashboardHeader />
      <AvailabilityToggle />
      <EarningsSummary />
      <IncomingBookings />
      <RouteManagement />
    </>
  );
}
