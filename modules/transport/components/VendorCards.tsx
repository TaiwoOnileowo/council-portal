import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPublicTransports } from "@/lib/actions/transport.action";
import VendorCardsList from "./VendorCardsList";

export default async function VendorCards() {
  const [vendors, session] = await Promise.all([getPublicTransports(), auth()]);

  let user: { id: string; name: string; phone: string; email: string } = {
    id: "",
    name: "",
    phone: "",
    email: "",
  };
  if (session?.user?.id) {
    const u = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, first_name: true, last_name: true, phone: true, email: true },
    });
    if (u)
      user = {
        id: session.user.id,
        name: `${u.first_name} ${u.last_name}`,
        phone: u.phone,
        email: u.email,
      };
  }

  return <VendorCardsList vendors={vendors} user={user} />;
}
