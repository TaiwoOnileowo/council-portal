import { auth } from "@/auth";
import { db } from "@/lib/db";
import IncomingBookings from "@/modules/transport/components/IncomingBookings";
import RouteManagement from "@/modules/transport/components/RouteManagement";
import AvailabilityToggle from "@/modules/vendor/components/AvailabilityToggle";
import VendorDashboardHeader from "@/modules/vendor/components/VendorDashboardHeader";
import { redirect } from "next/navigation";

export default async function VendorDashboardPage() {
  const session = await auth();
  if (session?.user?.role !== "VENDOR") redirect("/vendor-gate");

  const vendor = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      first_name: true,
      last_name: true,
      image: true,
      vendor_profile: {
        select: { business_name: true, is_active: true, category: true },
      },
    },
  });

  if (!vendor || !vendor.vendor_profile) redirect("/vendor-gate");

  return (
    <>
      <VendorDashboardHeader
        firstName={vendor.first_name}
        lastName={vendor.last_name}
        businessName={vendor.vendor_profile.business_name}
        image={vendor.image}
      />
      <AvailabilityToggle initialIsActive={vendor.vendor_profile.is_active} />
      <IncomingBookings />
      <RouteManagement />
    </>
  );
}
