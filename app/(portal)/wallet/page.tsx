import TransactionHistory from "@/modules/wallet/components/TransactionHistory";
import { WalletBalancePanel } from "@/modules/wallet/components/WalletCard";
import TopUpConfirmation from "@/modules/wallet/components/TopUpConfirmation";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ topup_ref?: string }>;
}) {
  const { topup_ref: topUpRef } = await searchParams;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-heading text-[20px] sm:text-[26px] font-bold leading-tight text-portal-text mb-5">
          Wallet
        </h1>
        {topUpRef && <TopUpConfirmation reference={topUpRef} />}
        <WalletBalancePanel />
      </div>
      <TransactionHistory />
    </div>
  );
}
