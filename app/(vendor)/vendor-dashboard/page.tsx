import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { VendorCategory } from "@/generated/prisma/enums";
import AvailabilityToggle from "@/modules/vendor/components/AvailabilityToggle";
import VendorDashboardHeader from "@/modules/vendor/components/VendorDashboardHeader";
import TransportDashboard from "@/modules/transport/components/TransportDashboard";

// Each vendor category renders its own vertical dashboard section. Add a new
// entry here when a category launches; the generic shell (header + availability)
// is shared.
const CATEGORY_DASHBOARD: Record<VendorCategory, React.ComponentType> = {
  TRANSPORT: TransportDashboard,
};

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

  const CategorySection = CATEGORY_DASHBOARD[vendor.vendor_profile.category];

  return (
    <>
      <VendorDashboardHeader
        firstName={vendor.first_name}
        lastName={vendor.last_name}
        businessName={vendor.vendor_profile.business_name}
        image={vendor.image}
      />
      <AvailabilityToggle initialIsActive={vendor.vendor_profile.is_active} />
      {CategorySection ? <CategorySection /> : null}
    </>
  );
}
