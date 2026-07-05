"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { startPayment, getPaymentByReference } from "@/lib/payments";
import { getSetting } from "@/lib/settings";
import { nairaToKobo } from "@/lib/money";
import {
  WALLET_TX_PAGE_SIZE,
  type WalletTopupMetadata,
  type WalletTransactionsFilters,
  type WalletTransactionsResponse,
} from "@/modules/wallet/wallet.types";

export async function currentBalance(
  userId: string,
  client: Prisma.TransactionClient | typeof db = db,
): Promise<number> {
  const latest = await client.wallet.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    select: { balance: true },
  });
  return latest?.balance ?? 0;
}

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

export type WalletOwner = { userId: string } | { vendorId: string };

export async function creditWallet(
  owner: WalletOwner,
  entry: {
    amountKobo: number; // signed delta; positive credits, negative debits
    reason: string;
    type: string;
    modelResponsible: string;
    reference: string;
  },
  client: Prisma.TransactionClient | typeof db = db,
): Promise<{ balance: number }> {
  const isVendor = "vendorId" in owner;
  const ownerWhere = isVendor
    ? { vendor_id: owner.vendorId }
    : { user_id: owner.userId };
  const readBalance = (c: Prisma.TransactionClient | typeof db) =>
    isVendor ? vendorBalance(owner.vendorId, c) : currentBalance(owner.userId, c);

  const write = async (tx: Prisma.TransactionClient | typeof db) => {
    const balance = await readBalance(tx);
    return tx.wallet.create({
      data: {
        ...ownerWhere,
        difference: entry.amountKobo,
        balance: balance + entry.amountKobo,
        reason: entry.reason,
        type: entry.type,
        model_responsible: entry.modelResponsible,
        reference: entry.reference,
      },
      select: { balance: true },
    });
  };

  // Already inside a caller-managed transaction (e.g. a webhook finalizing a
  // payment) — write directly and let any error abort/roll back that
  // transaction rather than swallowing it here.
  if (client !== db) {
    const created = await write(client);
    return { balance: created.balance };
  }

  try {
    const created = await db.$transaction((tx) => write(tx));
    return { balance: created.balance };
  } catch {
    // Unique constraint on reference — already processed.
    return { balance: await readBalance(db) };
  }
}

export async function getWalletBalance() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const isVendor = session.user.role === "VENDOR";
  const balance = isVendor
    ? await vendorBalance(session.user.id)
    : await currentBalance(session.user.id);

  return { balance };
}

export async function topUpWallet(amountKobo: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (amountKobo <= 0) return { error: "Invalid amount" };

  const ref = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  const { balance } = await creditWallet(
    { userId: session.user.id },
    {
      amountKobo,
      reason: "Wallet top-up",
      type: "topup",
      modelResponsible: "Payment",
      reference: ref,
    },
  );

  return { balance, ref };
}

export async function startTopUp(
  amountKobo: number,
): Promise<
  { authorizationUrl: string; reference: string } | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    return { error: "Invalid amount." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { first_name: true, last_name: true, email: true },
  });
  if (!user) return { error: "User not found." };

  const { serviceFeeRate, serviceFeeCapNaira } = await getSetting(
    "pricing_config",
  );
  const feeKobo = Math.min(
    Math.round(amountKobo * serviceFeeRate),
    nairaToKobo(serviceFeeCapNaira),
  );
  const chargeKobo = amountKobo + feeKobo;

  const reference = `TOPUP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;

  const metadata: WalletTopupMetadata = { requestedAmountKobo: amountKobo };

  return startPayment({
    reference,
    amountKobo: chargeKobo,
    userId: session.user.id,
    destination: "wallet_topup",
    email: user.email,
    name: `${user.first_name} ${user.last_name}`,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?topup_ref=${reference}`,
    metadata,
  });
}

export type TopUpStatus =
  | { status: "SUCCESS"; balance: number }
  | { status: "PENDING" | "FAILED" }
  | { error: string };

export async function checkTopUpStatus(
  reference: string,
): Promise<TopUpStatus> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const payment = await getPaymentByReference(reference);
  if (!payment || payment.user_id !== session.user.id) {
    return { error: "Payment not found." };
  }

  if (payment.status === "SUCCESS") {
    return {
      status: "SUCCESS",
      balance: await currentBalance(session.user.id),
    };
  }

  return { status: payment.status };
}

export async function getTransactionHistory(
  filters: WalletTransactionsFilters = { type: "all", page: 0 },
): Promise<
  { ok: true; data: WalletTransactionsResponse } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const isVendor = session.user.role === "VENDOR";
  const scopeFilter = isVendor
    ? { vendor_id: session.user.id }
    : { user_id: session.user.id };

  const where: Prisma.walletWhereInput = {
    ...scopeFilter,
    ...(filters.type !== "all" ? { type: filters.type } : {}),
  };

  const safePage = Math.max(0, filters.page);

  const [entries, total] = await Promise.all([
    db.wallet.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: safePage * WALLET_TX_PAGE_SIZE,
      take: WALLET_TX_PAGE_SIZE,
    }),
    db.wallet.count({ where }),
  ]);

  return {
    ok: true,
    data: {
      total,
      transactions: entries.map((t) => ({
        id: t.id,
        reason: t.reason,
        type: t.type,
        difference: t.difference,
        balance: t.balance,
        reference: t.reference,
        createdAt: t.created_at.toISOString(),
      })),
    },
  };
}
