import BookingsList from "@/modules/dashboard/components/BookingsList";
import TransportHeader from "@/modules/transport/components/TransportHeader";
import VendorCards from "@/modules/transport/components/VendorCards";

export default function TransportPage() {
  return (
    <>
      <TransportHeader />
      {/* <QuickBookBar /> */}
      <VendorCards />
      {/* <SharedRides /> */}
      <BookingsList />
    </>
  );
}
