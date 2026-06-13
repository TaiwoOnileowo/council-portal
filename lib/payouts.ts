import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function vendorBalance(
  vendorId: string,
  client: Prisma.TransactionClient | typeof db = db,
): Promise<number> {
  const latest = await client.wallet.findFirst({
    where: { vendor_id: vendorId },
    orderBy: { created_at: "desc" },
    select: { balance: true },
  });
  return latest?.balance ?? 0;
}

// Credits the vendor back and marks the payout FAILED. Idempotent: the reversal
// ledger entry's reference is unique, and the status guard prevents double-handling
// across the sync path and the webhook.
export async function reversePayout(
  reference: string,
  reason: string,
): Promise<void> {
  const reversalRef = `${reference}-REV`;

  try {
    await db.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { reference },
        select: { vendor_id: true, amount: true, status: true },
      });

      if (!payout || payout.status === "FAILED" || payout.status === "SUCCESS") {
        return;
      }

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${payout.vendor_id}))`;

      const balance = await vendorBalance(payout.vendor_id, tx);

      await tx.wallet.create({
        data: {
          vendor_id: payout.vendor_id,
          difference: payout.amount,
          balance: balance + payout.amount,
          reason: "Withdrawal reversed",
          type: "payout_reversal",
          model_responsible: "Payout",
          reference: reversalRef,
        },
      });

      await tx.payout.update({
        where: { reference },
        data: { status: "FAILED", failure_reason: reason },
      });
    });
  } catch {
    // Unique constraint on reversalRef — already reversed.
  }
}

export async function markPayoutSuccess(reference: string): Promise<void> {
  await db.payout.updateMany({
    where: { reference, status: { in: ["PENDING", "PROCESSING"] } },
    data: { status: "SUCCESS" },
  });
}
