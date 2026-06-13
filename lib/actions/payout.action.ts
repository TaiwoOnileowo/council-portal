"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MIN_PAYOUT_KOBO, koboToNaira } from "@/lib/money";
import { reversePayout } from "@/lib/payouts";
import { vendorBalance, vendorEffectiveBalance } from "@/lib/actions/wallet.action";

export type VendorWalletSummary = {
  balance: number; // available, in kobo
  totalEarned: number; // lifetime earnings, in kobo
  totalPaidOut: number; // settled + in-flight payouts, in kobo
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
    vendorEffectiveBalance(vendorId),
    db.wallet.aggregate({
      where: { vendor_id: vendorId, type: "earning" },
      _sum: { difference: true },
    }),
    db.payout.aggregate({
      where: { vendor_id: vendorId, status: { not: "FAILED" } },
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
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
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
      status: p.status,
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
  if (amountKobo < MIN_PAYOUT_KOBO) {
    return {
      error: `Minimum withdrawal is ₦${koboToNaira(MIN_PAYOUT_KOBO).toLocaleString("en-NG")}.`,
    };
  }

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

  // Create the payout record atomically, serialized per-vendor to prevent
  // concurrent requests from both passing the effective-balance check.
  const setup = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${vendorId}))`;

    const [balance, pendingAgg] = await Promise.all([
      vendorBalance(vendorId, tx),
      tx.payout.aggregate({
        where: { vendor_id: vendorId, status: { in: ["PENDING", "PROCESSING"] } },
        _sum: { amount: true },
      }),
    ]);
    const effectiveBalance = balance - (pendingAgg._sum.amount ?? 0);
    if (effectiveBalance < amountKobo) {
      return { error: "INSUFFICIENT_BALANCE" as const };
    }

    const payout = await tx.payout.create({
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
      select: { id: true },
    });

    return { payoutId: payout.id };
  });

  if ("error" in setup) {
    return { error: "Insufficient balance." };
  }

  // Fire the transfer. On any failure, reverse the debit and mark the payout failed.
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) {
    await reversePayout(reference, "Payment service is not configured.");
    return { error: "Payment service is not configured." };
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
      data: {
        status: "PROCESSING",
        flw_transfer_id: String(json.data.id),
      },
    });

    return { reference };
  } catch {
    await reversePayout(reference, "Network error while initiating transfer.");
    return { error: "Withdrawal failed. Please try again." };
  }
}
