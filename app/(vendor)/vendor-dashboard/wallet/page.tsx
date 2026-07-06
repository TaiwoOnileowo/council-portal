import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import TransactionHistory from "@/modules/wallet/components/TransactionHistory";
import { WalletBalancePanel } from "@/modules/wallet/components/WalletCard";
import { isWalletEnabled } from "@/lib/payment-config";

export default async function VendorWalletPage() {
  if (!(await isWalletEnabled())) redirect("/vendor-dashboard");

  return (
    <div className="space-y-7">
      <div>
        <PageHeader title="Earnings" size="md" />
        <WalletBalancePanel />
      </div>
      <TransactionHistory />
    </div>
  );
}
