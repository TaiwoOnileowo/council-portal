import { auth } from "@/auth";
import { db } from "@/lib/db";
import AnnouncementBanner from "@/components/portal/AnnouncementBanner";
import BookingsList from "@/components/portal/BookingsList";
import { StatsRow } from "@/components/portal/StatsRow";
import TopBar from "@/components/portal/TopBar";

export default async function Home() {
  const session = await auth();

  let firstName = "there";
  if (session?.user?.id) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    if (dbUser) {
      firstName = dbUser.name.trim().split(/\s+/)[0];
    }
  }

  return (
    <>
      <TopBar firstName={firstName} />
      <AnnouncementBanner />
      <StatsRow />

      <div className="grid grid-cols-[1.4fr_1fr] gap-5 mb-7">
        <BookingsList />
      </div>
    </>
  );
}
