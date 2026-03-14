import AnnouncementBanner from "@/components/portal/AnnouncementBanner";
import BookingsList from "@/components/portal/BookingsList";
import Sidebar from "@/components/portal/Sidebar";
import { StatsRow } from "@/components/portal/StatsRow";
import TopBar from "@/components/portal/TopBar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-portal-bg">
      <Sidebar />
      <main className="ml-[260px] flex-1 px-10 py-8 max-w-[calc(100vw-260px)]">
        <TopBar />
        <AnnouncementBanner />
        <StatsRow />

        <div className="grid grid-cols-[1.4fr_1fr] gap-5 mb-7">
          <BookingsList />
        </div>
      </main>
    </div>
  );
}
