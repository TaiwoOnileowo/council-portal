import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import VendorProfileDetails from "@/components/portal/vendor/profile/VendorProfileDetails";
import VendorTransportProfile from "@/components/portal/vendor/profile/VendorTransportProfile";
import VendorChangePassword from "@/components/portal/vendor/profile/VendorChangePassword";
import VendorReviews from "@/components/portal/vendor/profile/VendorReviews";

export default async function VendorProfilePage() {
  const session = await auth();
  if (!session?.user?.isVendor) redirect("/vendor-gate");

  const vendor = await db.vendor.findUnique({ where: { id: session.user.id } });
  if (!vendor) redirect("/vendor-gate");

  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-[24px] font-extrabold text-portal-text">Profile</h1>
        <p className="text-[13px] text-portal-muted mt-1">
          Manage your personal information and transport profile
        </p>
      </div>

      <div className="grid grid-cols-[1.2fr_1fr] gap-5">
        <div className="space-y-5">
          <VendorProfileDetails
            vendor={{
              id: vendor.id,
              firstName: vendor.firstName,
              lastName: vendor.lastName,
              email: vendor.email,
            }}
          />
          <VendorChangePassword vendorId={vendor.id} />
        </div>

        <div className="space-y-5">
          <VendorTransportProfile
            vendor={{
              id: vendor.id,
              firstName: vendor.firstName,
              lastName: vendor.lastName,
              email: vendor.email,
              transportName: vendor.transportName,
              tagline: vendor.tagline ?? "",
              description: vendor.description ?? "",
              instagram: vendor.instagram ?? "",
              tiktok: vendor.tiktok ?? "",
              image: vendor.image ?? "",
            }}
          />
          <VendorReviews />
        </div>
      </div>
    </>
  );
}
