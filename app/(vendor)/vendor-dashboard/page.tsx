import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import AvailabilityToggle from "@/components/portal/vendor-dashboard/AvailabilityToggle";
import IncomingBookings from "@/components/portal/vendor-dashboard/IncomingBookings";
import RouteManagement from "@/components/portal/vendor-dashboard/RouteManagement";
import VendorDashboardHeader from "@/components/portal/vendor-dashboard/VendorDashboardHeader";

export default async function VendorDashboardPage() {
  const session = await auth();
  if (!session?.user?.isVendor) redirect("/vendor-gate");

  const vendor = await db.vendor.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      transportName: true,
      image: true,
      isActive: true,
    },
  });

  if (!vendor) redirect("/vendor-gate");

  return (
    <>
      <VendorDashboardHeader
        firstName={vendor.firstName}
        lastName={vendor.lastName}
        transportName={vendor.transportName}
        image={vendor.image}
      />
      <AvailabilityToggle initialIsActive={vendor.isActive} />
      {/* <EarningsSummary /> */}
      <IncomingBookings />
      <RouteManagement />
    </>
  );
}
