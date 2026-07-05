import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getPublicTransports } from "@/lib/actions/transport.action";
import { getSetting } from "@/lib/settings";
import VendorCardsList from "./VendorCardsList";

export default async function VendorCards() {
  const [vendors, session, pricingConfig] = await Promise.all([
    getPublicTransports(),
    auth(),
    getSetting("pricing_config"),
  ]);

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

  return (
    <VendorCardsList
      vendors={vendors}
      user={user}
      serviceFeeRate={pricingConfig.serviceFeeRate}
    />
  );
}
