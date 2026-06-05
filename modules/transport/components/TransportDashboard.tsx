import IncomingBookings from "./IncomingBookings";
import RouteManagement from "./RouteManagement";

// The vendor-facing transport vertical: incoming bookings + route/price-list
// management. Rendered when the signed-in vendor's category is TRANSPORT.
export default function TransportDashboard() {
  return (
    <>
      <IncomingBookings />
      <RouteManagement />
    </>
  );
}
