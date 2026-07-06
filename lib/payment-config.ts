import { getSetting } from "@/lib/settings";

// Wallet-funded bookings only ever get settled through our own payout
// system (manual withdrawal or the scheduled cron) — split-payment checkout
// bookings settle directly to the vendor and never touch it. So wallet only
// makes sense to offer while at least one settlement path is actually live;
// otherwise it just accumulates vendor earnings nothing can ever pay out.
export async function isWalletEnabled(): Promise<boolean> {
  const { scheduledPayoutsEnabled, withdrawalsEnabled } =
    await getSetting("payment_config");
  return (
    scheduledPayoutsEnabled ||
    withdrawalsEnabled.flutterwave ||
    withdrawalsEnabled.paystack
  );
}
