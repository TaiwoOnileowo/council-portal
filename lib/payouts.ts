import { cacheDel, cacheSetIfNotExists } from "@/lib/cache";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { koboToNaira } from "@/lib/money";
import { vendorBalance } from "@/lib/actions/wallet.action";

export const payoutLockKey = (vendorId: string) => `payout:lock:${vendorId}`;

type PayoutBankDetails = {
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
};

// Shared by the vendor-initiated withdrawal action and the scheduled payout
// route — creates the PENDING payout row and kicks off the Flutterwave
// transfer. The advisory lock (released only on a terminal outcome) is what
// actually prevents double-spending the same balance, since the wallet isn't
// debited until markPayoutSuccess runs on webhook confirmation.
export async function initiatePayout(
  vendorId: string,
  amountKobo: number,
  vendor: PayoutBankDetails,
): Promise<{ reference: string } | { error: string }> {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return { error: "Payment service is not configured." };

  const reference = `PO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const lockKey = payoutLockKey(vendorId);

  const acquired = await cacheSetIfNotExists(lockKey, reference, 24 * 60 * 60);
  if (!acquired) {
    return { error: "A payout is already pending for this vendor." };
  }

  try {
    const balance = await db.$transaction(async (tx) => {
      const bal = await vendorBalance(vendorId, tx);
      if (bal < amountKobo) return null;

      await tx.payout.create({
        data: {
          reference,
          vendor_id: vendorId,
          amount: amountKobo,
          status: "PENDING",
          bank_code: vendor.bank_code,
          bank_name: vendor.bank_name,
          account_number: vendor.account_number,
          account_name: vendor.account_name,
        },
      });

      return bal;
    });

    if (balance === null) {
      await cacheDel(lockKey);
      return { error: "Insufficient balance." };
    }
  } catch (err) {
    await cacheDel(lockKey);
    // A partial unique index (one PENDING payout per vendor, enforced in a
    // migration — Prisma's schema DSL can't express the WHERE clause) is the
    // durable backstop behind the lock above: it catches a second attempt
    // even if the lock already expired while an earlier payout was still
    // unresolved, which a TTL-bound lock alone can't guarantee against.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "A payout is already pending for this vendor." };
    }
    return { error: "Failed to create payout. Please try again." };
  }

  try {
    const res = await fetch("https://api.flutterwave.com/v3/transfers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_bank: vendor.bank_code,
        account_number: vendor.account_number,
        amount: koboToNaira(amountKobo),
        currency: "NGN",
        reference,
        narration: "Vendor payout",
      }),
    });

    const json = await res.json();

    if (json.status !== "success" || !json.data) {
      await reversePayout(
        reference,
        json.message ?? "Transfer could not be initiated.",
      );
      return { error: json.message ?? "Withdrawal failed. Please try again." };
    }

    await db.payout.update({
      where: { reference },
      data: { transfer_id: String(json.data.id) },
    });

    return { reference };
  } catch {
    await reversePayout(reference, "Network error while initiating transfer.");
    return { error: "Withdrawal failed. Please try again." };
  }
}

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
