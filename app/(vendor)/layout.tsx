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
      <main className="ml-[260px] flex-1 px-10 py-8 max-w-[calc(100vw-260px)]">
        {children}
      </main>
    </div>
  );
}
