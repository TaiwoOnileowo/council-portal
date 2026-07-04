import PageHeader from "@/components/ui/PageHeader";
import TransactionHistory from "@/modules/wallet/components/TransactionHistory";
import { WalletBalancePanel } from "@/modules/wallet/components/WalletCard";

const AdminEarningsPage = () => {
  return (
    <div className="space-y-7">
      <div>
        <PageHeader title="Earnings" size="md" />
        <WalletBalancePanel />
      </div>
      <TransactionHistory />
    </div>
  );
};

export default AdminEarningsPage;
