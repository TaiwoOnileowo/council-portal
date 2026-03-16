import QuickBookBar from "@/components/portal/transport/QuickBookBar";
import RecentTrips from "@/components/portal/transport/RecentTrips";
import TransportHeader from "@/components/portal/transport/TransportHeader";
import VendorCards from "@/components/portal/transport/VendorCards";

export default function TransportPage() {
  return (
    <>
      <TransportHeader />
      {/* <QuickBookBar /> */}
      <VendorCards />
      {/* <SharedRides /> */}
      <RecentTrips />
    </>
  );
}
