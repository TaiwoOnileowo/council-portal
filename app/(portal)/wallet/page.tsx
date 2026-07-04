import TransactionHistory from "@/modules/wallet/components/TransactionHistory";
import { WalletBalancePanel } from "@/modules/wallet/components/WalletCard";

export default function WalletPage() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-heading text-[20px] sm:text-[26px] font-bold leading-tight text-portal-text mb-5">
          Wallet
        </h1>
        <WalletBalancePanel />
      </div>
      <TransactionHistory />
    </div>
  );
}
