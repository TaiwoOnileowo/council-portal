import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Sidebar from "@/components/portal/Sidebar";
import ChangePassword from "@/components/portal/profile/ChangePassword";
import MyReviews from "@/components/portal/profile/MyReviews";
import ProfileDetails from "@/components/portal/profile/ProfileDetails";
import ProfileHeader from "@/components/portal/profile/ProfileHeader";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/gate");

  const dbUser = await db.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/gate");

  const nameParts = dbUser.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");
  const level = dbUser.level.replace("L", ""); // "L300" → "300"

  return (
    <div className="flex min-h-screen bg-portal-bg">
      <Sidebar user={{ name: dbUser.name, matricNumber: dbUser.matricNumber, level }} />
      <main className="ml-[260px] flex-1 px-10 py-8 max-w-[calc(100vw-260px)]">
        <ProfileHeader />

        <div className="grid grid-cols-[1.2fr_1fr] gap-5">
          <div className="space-y-5">
            <ProfileDetails
              user={{
                id: dbUser.id,
                firstName,
                lastName,
                email: dbUser.email,
                phone: dbUser.phone,
                matricNumber: dbUser.matricNumber,
                level,
                department: dbUser.department,
              }}
            />
            <ChangePassword email={dbUser.email} />
          </div>

          <div>
            <MyReviews />
          </div>
        </div>
      </main>
    </div>
  );
}
