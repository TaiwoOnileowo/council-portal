import { auth } from "@/auth";
import { db } from "@/lib/db";
import ChangePassword from "@/modules/profile/components/ChangePassword";
import ProfileDetails from "@/modules/profile/components/ProfileDetails";
import ProfileHeader from "@/modules/profile/components/ProfileHeader";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/gate");

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    include: { student_profile: true },
  });
  if (!dbUser) redirect("/gate");

  const level = dbUser.student_profile?.level.replace("L", "") ?? "";

  return (
    <>
      <ProfileHeader />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="space-y-5">
          <ProfileDetails
            user={{
              id: dbUser.id,
              firstName: dbUser.first_name,
              lastName: dbUser.last_name,
              email: dbUser.email,
              phone: dbUser.phone,
              matricNumber: dbUser.student_profile?.matric_number ?? "",
              level,
              department: dbUser.student_profile?.department ?? "",
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
