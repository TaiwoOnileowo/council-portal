import { auth } from "@/auth";
import ChangePassword from "@/modules/profile/components/ChangePassword";
import VendorBankDetails from "@/modules/vendor/components/BankDetails";
import VendorProfileDetails from "@/modules/vendor/components/VendorProfileDetails";
import VendorBusinessProfile from "@/modules/vendor/components/VendorBusinessProfile";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function VendorProfilePage() {
  const session = await auth();
  if (session?.user?.role !== "VENDOR") redirect("/vendor-gate");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { vendor_profile: true },
  });
  if (!user || !user.vendor_profile) redirect("/vendor-gate");

  const vendor = {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    image: user.image,
    transportName: user.vendor_profile.business_name,
    tagline: user.vendor_profile.tagline,
    description: user.vendor_profile.description,
    instagram: user.vendor_profile.instagram,
    tiktok: user.vendor_profile.tiktok,
    bankCode: user.vendor_profile.bank_code,
    bankName: user.vendor_profile.bank_name,
    accountNumber: user.vendor_profile.account_number,
    accountName: user.vendor_profile.account_name,
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-[24px] font-extrabold text-portal-text">
          Profile
        </h1>
        <p className="text-[13px] text-portal-muted mt-1">
          Manage your personal information and transport profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="space-y-5">
          <VendorProfileDetails
            vendor={{
              id: vendor.id,
              firstName: vendor.firstName,
              lastName: vendor.lastName,
              email: vendor.email,
              phone: vendor.phone ?? "",
            }}
          />
          <ChangePassword email={vendor.email} />
          <VendorBankDetails
            vendor={{
              id: vendor.id,
              bankCode: vendor.bankCode ?? undefined,
              bankName: vendor.bankName ?? undefined,
              accountNumber: vendor.accountNumber ?? undefined,
              accountName: vendor.accountName ?? undefined,
            }}
          />
        </div>

        <div className="space-y-5">
          <VendorBusinessProfile
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
        </div>
      </div>
    </>
  );
}
