import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";
import { isWalletEnabled } from "@/lib/payment-config";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.scope !== "student") {
    if (session?.user?.scope === "admin") redirect("/admin");
    else if (session?.user?.scope === "vendor") redirect("/vendor-dashboard");
    else redirect("/gate");
  }

  const walletEnabled = await isWalletEnabled();

  return (
    <div className="flex min-h-screen bg-portal-accent-bg/50 ">
      <Sidebar variant="student" walletEnabled={walletEnabled} />
      <main className="lg:ml-[260px] flex-1 min-w-0 px-4 pt-[70px] pb-8 sm:px-6 lg:px-10 lg:pt-8 lg:max-w-[calc(100vw-260px)]">
        {children}
      </main>
    </div>
  );
}
