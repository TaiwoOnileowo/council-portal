import Sidebar from "@/components/portal/Sidebar";
import TopBar from "@/components/portal/TopBar";
import AnnouncementBanner from "@/components/portal/AnnouncementBanner";
import { StatsRow } from "@/components/portal/StatsRow";
import ModuleCards from "@/components/portal/ModuleCards";
import BookingsList from "@/components/portal/BookingsList";
import QuickActions from "@/components/portal/QuickActions";
import ActivityList from "@/components/portal/ActivityList";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-portal-bg">
      <Sidebar />
      <main className="ml-[260px] flex-1 px-10 py-8 max-w-[calc(100vw-260px)]">
        <TopBar />
        <AnnouncementBanner />
        <StatsRow />

        {/* Two column: bookings + quick actions */}
        <div className="grid grid-cols-[1.4fr_1fr] gap-5 mb-7">
          <BookingsList />
          {/* <QuickActions /> */}
        </div>
      </main>
    </div>
  );
}
