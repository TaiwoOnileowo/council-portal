import { cacheDel } from "@/lib/cache";
import { db } from "@/lib/db";
import { vendorBalance } from "@/lib/actions/wallet.action";

export const payoutLockKey = (vendorId: string) => `payout:lock:${vendorId}`;

export async function reversePayout(reference: string, reason: string): Promise<void> {
  const payout = await db.payout.findUnique({
    where: { reference },
    select: { vendor_id: true, status: true },
  });
  if (!payout || payout.status !== "PENDING") return;

  await db.payout.updateMany({
    where: { reference, status: "PENDING" },
    data: { status: "FAILED", failure_reason: reason },
  });

  await cacheDel(payoutLockKey(payout.vendor_id));
}

export async function markPayoutSuccess(reference: string): Promise<void> {
  let vendorId: string | null = null;

  try {
    await db.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { reference },
        select: { vendor_id: true, amount: true, status: true },
      });
      if (!payout || payout.status !== "PENDING") return;

      vendorId = payout.vendor_id;

      const balance = await vendorBalance(payout.vendor_id, tx);

      await tx.wallet.create({
        data: {
          vendor_id: payout.vendor_id,
          difference: -payout.amount,
          balance: balance - payout.amount,
          reason: "Withdrawal",
          type: "payout",
          model_responsible: "Payout",
          reference,
        },
      });

      await tx.payout.update({
        where: { reference },
        data: { status: "SUCCESS" },
      });
    });
  } catch {
    // Unique constraint on wallet reference — already processed.
  }

  if (vendorId) {
    await cacheDel(payoutLockKey(vendorId));
  }
}
