"use client";

import Sidebar from "@/components/portal/Sidebar";
import ProfileHeader from "@/components/portal/profile/ProfileHeader";
import ProfilePhoto from "@/components/portal/profile/ProfilePhoto";
import ProfileDetails from "@/components/portal/profile/ProfileDetails";
import ChangePassword from "@/components/portal/profile/ChangePassword";
import MyReviews from "@/components/portal/profile/MyReviews";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen bg-portal-bg">
      <Sidebar />
      <main className="ml-[260px] flex-1 px-10 py-8 max-w-[calc(100vw-260px)]">
        <ProfileHeader />

        <div className="grid grid-cols-[1.2fr_1fr] gap-5">
          {/* Left column — photo, details, password */}
          <div className="space-y-5">
            <ProfilePhoto />
            <ProfileDetails />
            <ChangePassword />
          </div>

          {/* Right column — reviews */}
          <div>
            <MyReviews />
          </div>
        </div>
      </main>
    </div>
  );
}
