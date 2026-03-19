import { auth } from "@/auth";
import { db } from "@/lib/db";
import Sidebar from "@/components/portal/Sidebar";
import { redirect } from "next/navigation";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user?.isVendor) {
    redirect("/vendor-dashboard");
  }

  let sidebarUser = null;
  if (session?.user?.id && !session.user.isVendor) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, matricNumber: true, level: true },
    });
    if (dbUser) {
      sidebarUser = {
        name: dbUser.name,
        matricNumber: dbUser.matricNumber,
        level: dbUser.level.replace("L", ""),
      };
    }
  }

  return (
    <div className="flex min-h-screen bg-portal-bg ">
      <Sidebar user={sidebarUser} />
      <main className="lg:ml-[260px] flex-1 px-4 pt-[70px] pb-8 sm:px-6 lg:px-10 lg:pt-8 lg:max-w-[calc(100vw-260px)]">
        {children}
      </main>
    </div>
  );
}
