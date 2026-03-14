import { auth } from "@/auth";
import { db } from "@/lib/db";
import AnnouncementBanner from "@/components/portal/AnnouncementBanner";
import BookingsList from "@/components/portal/BookingsList";
import Sidebar from "@/components/portal/Sidebar";
import { StatsRow } from "@/components/portal/StatsRow";
import TopBar from "@/components/portal/TopBar";

export default async function Home() {
  const session = await auth();

  let sidebarUser = null;
  if (session?.user?.id) {
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

  const firstName = sidebarUser?.name.trim().split(/\s+/)[0] ?? "there";

  return (
    <div className="flex min-h-screen bg-portal-bg">
      <Sidebar user={sidebarUser} />
      <main className="ml-[260px] flex-1 px-10 py-8 max-w-[calc(100vw-260px)]">
        <TopBar firstName={firstName} />
        <AnnouncementBanner />
        <StatsRow />

        <div className="grid grid-cols-[1.4fr_1fr] gap-5 mb-7">
          <BookingsList />
        </div>
      </main>
    </div>
  );
}
