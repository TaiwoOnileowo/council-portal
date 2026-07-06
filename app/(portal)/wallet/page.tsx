import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import TransactionHistory from "@/modules/wallet/components/TransactionHistory";
import { WalletBalancePanel } from "@/modules/wallet/components/WalletCard";
import TopUpConfirmation from "@/modules/wallet/components/TopUpConfirmation";
import { isWalletEnabled } from "@/lib/payment-config";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ topup_ref?: string; status?: string }>;
}) {
  if (!(await isWalletEnabled())) redirect("/transport");

  const { topup_ref: topUpRef, status } = await searchParams;

  return (
    <div className="space-y-7">
      <div>
        <PageHeader title="Wallet" size="md" />
        {topUpRef && (
          <TopUpConfirmation reference={topUpRef} initialStatus={status} />
        )}
        <WalletBalancePanel />
      </div>
      <TransactionHistory />
    </div>
  );
}
