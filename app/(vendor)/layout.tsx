import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import VendorSidebar from "@/components/portal/VendorSidebar";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isVendor) redirect("/vendor-gate");

  let sidebarVendor = null;
  const vendor = await db.vendor.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true, image: true },
  });
  if (vendor) {
    sidebarVendor = {
      name: `${vendor.firstName} ${vendor.lastName}`,
      email: vendor.email,
      image: vendor.image,
    };
  }

  return (
    <div className="flex min-h-screen bg-portal-bg">
      <VendorSidebar vendor={sidebarVendor} />
      <main className="lg:ml-[260px] flex-1 px-4 pt-[70px] pb-8 sm:px-6 lg:px-10 lg:pt-8 lg:max-w-[calc(100vw-260px)]">
        {children}
      </main>
    </div>
  );
}
