import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import ChangePassword from "@/modules/profile/components/ChangePassword";
import MyReviews from "@/modules/profile/components/MyReviews";
import ProfileDetails from "@/modules/profile/components/ProfileDetails";
import ProfileHeader from "@/modules/profile/components/ProfileHeader";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/gate");

  const dbUser = await db.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/gate");

  const nameParts = dbUser.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");
  const level = dbUser.level.replace("L", "");

  return (
    <>
      <ProfileHeader />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
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

        {/* <div>
          <MyReviews />
        </div> */}
      </div>
    </>
  );
}
