import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPublicVendors } from "@/lib/actions/vendor.action";
import VendorCardsList from "./VendorCardsList";

export default async function VendorCards() {
  const [vendors, session] = await Promise.all([getPublicVendors(), auth()]);

  let user = { name: "", phone: "" };
  if (session?.user?.id) {
    const u = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, phone: true },
    });
    if (u) user = { name: u.name, phone: u.phone };
  }

  return <VendorCardsList vendors={vendors} user={user} />;
}
