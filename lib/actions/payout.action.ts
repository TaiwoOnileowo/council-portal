"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { nairaToKobo, koboToNaira } from "@/lib/money";
import { initiatePayout } from "@/lib/payouts";
import { vendorBalance } from "@/lib/actions/wallet.action";
import { getSetting } from "@/lib/settings";

export type VendorWalletSummary = {
  balance: number; // available, in kobo
  totalEarned: number; // lifetime earnings, in kobo
  totalPaidOut: number; // settled payouts, in kobo
  bankAccount: { name: string; accountName: string; mask: string } | null;
  withdrawalsEnabled: boolean;
};

export async function getVendorWalletSummary(): Promise<
  { ok: true; data: VendorWalletSummary } | { ok: false; error: string }
> {
  const session = await auth();
  if (session?.user?.role !== "VENDOR") {
    return { ok: false, error: "Unauthorized" };
  }

  const vendorId = session.user.id;

  const [balance, earnedAgg, paidOutAgg, vendor, paymentConfig] =
    await Promise.all([
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
      getSetting("payment_config"),
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
      withdrawalsEnabled: paymentConfig.withdrawalsEnabled.flutterwave,
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
  const { minPayoutNaira } = await getSetting("pricing_config");
  const minPayoutKobo = nairaToKobo(minPayoutNaira);
  if (amountKobo < minPayoutKobo) {
    return {
      error: `Minimum withdrawal is ₦${koboToNaira(minPayoutKobo).toLocaleString("en-NG")}.`,
    };
  }

  const { withdrawalsEnabled } = await getSetting("payment_config");
  if (!withdrawalsEnabled.flutterwave) {
    return {
      error:
        "On-demand withdrawals are paused — vendors are settled automatically every few days. Check back soon.",
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

  return initiatePayout(vendorId, amountKobo, {
    bank_code: vendor.bank_code,
    bank_name: vendor.bank_name,
    account_number: vendor.account_number,
    account_name: vendor.account_name,
  });
}
