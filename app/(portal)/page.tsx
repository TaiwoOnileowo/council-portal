import AnnouncementBanner from "@/modules/dashboard/components/AnnouncementBanner";
import { StatsRow } from "@/modules/dashboard/components/StatsRow";
import TopBar from "@/components/TopBar";

export default function Home() {
  return (
    <>
      <TopBar />
      <AnnouncementBanner />
      <StatsRow />
    </>
  );
}
