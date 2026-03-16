import { getPublicVendors } from "@/lib/actions/vendor.action";
import VendorCardsList from "./VendorCardsList";

export default async function VendorCards() {
  const vendors = await getPublicVendors();
  return <VendorCardsList vendors={vendors} />;
}
