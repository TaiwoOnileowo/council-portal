import PageHeader from "@/components/ui/PageHeader";
import TransactionHistory from "@/modules/wallet/components/TransactionHistory";
import { WalletBalancePanel } from "@/modules/wallet/components/WalletCard";

export default function VendorWalletPage() {
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
