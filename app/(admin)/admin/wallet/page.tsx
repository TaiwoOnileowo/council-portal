import TransactionHistory from "@/modules/wallet/components/TransactionHistory";
import { WalletBalancePanel } from "@/modules/wallet/components/WalletCard";

const AdminEarningsPage = () => {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-heading text-[20px] sm:text-[26px] font-bold leading-tight text-portal-text mb-5">
          Earnings
        </h1>
        <WalletBalancePanel />
      </div>
      <TransactionHistory />
    </div>
  );
};

export default AdminEarningsPage;
