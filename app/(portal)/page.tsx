import TopBar from "@/components/TopBar";
import AnnouncementBanner from "@/modules/dashboard/components/AnnouncementBanner";
import BookingsList from "@/modules/dashboard/components/BookingsList";
import NextRideCard from "@/modules/dashboard/components/NextRideCard";
import { WalletChip } from "@/modules/wallet/components/WalletChip";

export default function Home() {
  return (
    <>
      <TopBar />
      <AnnouncementBanner />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <NextRideCard />
        </div>
        <div className="lg:col-span-1">
          <WalletChip />
        </div>
      </div>
      <BookingsList />
    </>
  );
}
