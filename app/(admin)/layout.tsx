import { auth } from "@/auth";
import Sidebar from "@/components/Sidebar";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin || session.user.scope !== "admin") redirect("/admin-gate");

  return (
    <div className="flex min-h-screen bg-portal-accent-bg/50">
      <Sidebar variant="admin" />
      <main className="lg:ml-[260px] flex-1 px-4 pt-[70px] pb-8 sm:px-6 lg:px-10 lg:pt-8 lg:max-w-[calc(100vw-260px)]">
        {children}
      </main>
    </div>
  );
}
