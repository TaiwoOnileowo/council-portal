"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { nairaToKobo, koboToNaira } from "@/lib/money";
import { reversePayout, payoutLockKey } from "@/lib/payouts";
import { vendorBalance } from "@/lib/actions/wallet.action";
import { cacheSetIfNotExists, cacheDel } from "@/lib/cache";
import { getSetting } from "@/lib/settings";

export type VendorWalletSummary = {
  balance: number; // available, in kobo
  totalEarned: number; // lifetime earnings, in kobo
  totalPaidOut: number; // settled payouts, in kobo
  bankAccount: { name: string; accountName: string; mask: string } | null;
};

export async function getVendorWalletSummary(): Promise<
  { ok: true; data: VendorWalletSummary } | { ok: false; error: string }
> {
  const session = await auth();
  if (session?.user?.role !== "VENDOR") {
    return { ok: false, error: "Unauthorized" };
  }

  const vendorId = session.user.id;

  const [balance, earnedAgg, paidOutAgg, vendor] = await Promise.all([
    vendorBalance(vendorId),
    db.wallet.aggregate({
      where: { vendor_id: vendorId, type: "earning" },
      _sum: { difference: true },
    }),
    db.payout.aggregate({
      where: { vendor_id: vendorId, status: "SUCCESS" },
      _sum: { amount: true },
    }),
    db.vendor_profile.findUnique({
      where: { user_id: vendorId },
      select: { bank_name: true, account_name: true, account_number: true },
    }),
  ]);

  const bankAccount =
    vendor?.bank_name && vendor.account_name && vendor.account_number
      ? {
          name: vendor.bank_name,
          accountName: vendor.account_name,
          mask: `••••${vendor.account_number.slice(-4)}`,
        }
      : null;

  return {
    ok: true,
    data: {
      balance,
      totalEarned: earnedAgg._sum.difference ?? 0,
      totalPaidOut: paidOutAgg._sum.amount ?? 0,
      bankAccount,
    },
  };
}

export type PayoutHistoryItem = {
  id: string;
  reference: string;
  amount: number; // kobo
  status: "PENDING" | "SUCCESS" | "FAILED";
  bankName: string;
  accountMask: string;
  failureReason: string | null;
  createdAt: string;
};

export async function getPayoutHistory(): Promise<
  { ok: true; data: PayoutHistoryItem[] } | { ok: false; error: string }
> {
  const session = await auth();
  if (session?.user?.role !== "VENDOR") {
    return { ok: false, error: "Unauthorized" };
  }

  const payouts = await db.payout.findMany({
    where: { vendor_id: session.user.id },
    orderBy: { created_at: "desc" },
    take: 20,
  });

  return {
    ok: true,
    data: payouts.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: p.amount,
      status: p.status as PayoutHistoryItem["status"],
      bankName: p.bank_name,
      accountMask: `••••${p.account_number.slice(-4)}`,
      failureReason: p.failure_reason,
      createdAt: p.created_at.toISOString(),
    })),
  };
}

export async function requestPayout(
  amountKobo: number,
): Promise<{ reference: string } | { error: string }> {
  const session = await auth();
  if (session?.user?.role !== "VENDOR") return { error: "Unauthorized" };

  const vendorId = session.user.id;

  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    return { error: "Invalid amount." };
  }
  const { minPayoutNaira } = await getSetting("booking_pricing_config");
  const minPayoutKobo = nairaToKobo(minPayoutNaira);
  if (amountKobo < minPayoutKobo) {
    return {
      error: `Minimum withdrawal is ₦${koboToNaira(minPayoutKobo).toLocaleString("en-NG")}.`,
    };
  }

  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return { error: "Payment service is not configured." };

  const vendor = await db.vendor_profile.findUnique({
    where: { user_id: vendorId },
    select: {
      bank_code: true,
      bank_name: true,
      account_number: true,
      account_name: true,
    },
  });

  if (
    !vendor?.bank_code ||
    !vendor.bank_name ||
    !vendor.account_number ||
    !vendor.account_name
  ) {
    return { error: "Add your bank details before withdrawing." };
  }

  const reference = `PO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const lockKey = payoutLockKey(vendorId);

  const acquired = await cacheSetIfNotExists(lockKey, reference, 24 * 60 * 60);
  if (!acquired) {
    return { error: "You already have a pending withdrawal. Please wait for it to complete." };
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
          bank_code: vendor.bank_code!,
          bank_name: vendor.bank_name!,
          account_number: vendor.account_number!,
          account_name: vendor.account_name!,
        },
      });

      return bal;
    });

    if (balance === null) {
      await cacheDel(lockKey);
      return { error: "Insufficient balance." };
    }
  } catch {
    await cacheDel(lockKey);
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
      await reversePayout(reference, json.message ?? "Transfer could not be initiated.");
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
