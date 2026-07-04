"use client";

import { useModalStore } from "@/lib/stores/modal.store";
import WithdrawModal from "@/modules/vendor/components/WithdrawModal";
import TopUpModal from "@/modules/wallet/components/TopUpModal";

export default function GlobalModals() {
  const { topUp, withdraw, closeTopUp, closeWithdraw } = useModalStore();

  return (
    <>
      <TopUpModal key={topUp.openId} open={topUp.open} onClose={closeTopUp} />
      <WithdrawModal
        open={withdraw.open}
        onClose={closeWithdraw}
        availableKobo={withdraw.availableKobo}
        bankAccount={withdraw.bankAccount}
      />
    </>
  );
}
