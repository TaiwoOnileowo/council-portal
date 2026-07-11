import { getSetting } from "@/lib/settings";
import AuthGate from "@/modules/auth/components/AuthGate";

export default async function VendorGatePage() {
  const { commissionNaira } = await getSetting("pricing_config");
  return <AuthGate mode="vendor" commissionNaira={commissionNaira} />;
}
