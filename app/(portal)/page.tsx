import { auth } from "@/auth";
import AnnouncementBanner from "@/modules/dashboard/components/AnnouncementBanner";
import { StatsRow } from "@/modules/dashboard/components/StatsRow";
import TopBar from "@/components/TopBar";
import { db } from "@/lib/db";

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
    </>
  );
}
