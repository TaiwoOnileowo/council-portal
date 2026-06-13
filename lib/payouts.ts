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

export async function vendorEffectiveBalance(vendorId: string): Promise<number> {
  const [balance, pendingAgg] = await Promise.all([
    vendorBalance(vendorId),
    db.payout.aggregate({
      where: { vendor_id: vendorId, status: { in: ["PENDING", "PROCESSING"] } },
      _sum: { amount: true },
    }),
  ]);
  return balance - (pendingAgg._sum.amount ?? 0);
}

export async function reversePayout(
  reference: string,
  reason: string,
): Promise<void> {
  await db.payout.updateMany({
    where: { reference, status: { notIn: ["SUCCESS", "FAILED"] } },
    data: { status: "FAILED", failure_reason: reason },
  });
}

export async function markPayoutSuccess(reference: string): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { reference },
        select: { vendor_id: true, amount: true, status: true },
      });
      if (!payout || !["PENDING", "PROCESSING"].includes(payout.status)) return;

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${payout.vendor_id}))`;

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
}
