import TopBar from "@/components/TopBar";
import AnnouncementBanner from "@/modules/dashboard/components/AnnouncementBanner";
import BookingsList from "@/modules/dashboard/components/BookingsList";
import NextRideCard from "@/modules/dashboard/components/NextRideCard";

export default function Home() {
  return (
    <>
      <TopBar />
      <AnnouncementBanner />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NextRideCard />
          <BookingsList />
        </div>
      </div>
    </>
  );
}
