import BookingsList from "@/modules/dashboard/components/BookingsList";
import TransportHeader from "@/modules/transport/components/TransportHeader";
import VendorCards from "@/modules/transport/components/VendorCards";
import BookingCheckoutConfirmation from "@/modules/transport/components/BookingCheckoutConfirmation";

export default async function TransportPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_ref?: string; status?: string }>;
}) {
  const { booking_ref: bookingRef, status } = await searchParams;

  return (
    <>
      <TransportHeader />
      {bookingRef && (
        <BookingCheckoutConfirmation
          reference={bookingRef}
          initialStatus={status}
        />
      )}
      {/* <QuickBookBar /> */}
      <VendorCards />
      {/* <SharedRides /> */}
      <BookingsList />
    </>
  );
}
