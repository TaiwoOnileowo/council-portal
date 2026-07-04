"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  WALLET_TX_PAGE_SIZE,
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
): Promise<{ balance: number }> {
  const isVendor = "vendorId" in owner;
  const ownerWhere = isVendor
    ? { vendor_id: owner.vendorId }
    : { user_id: owner.userId };
  const readBalance = (client: Prisma.TransactionClient | typeof db) =>
    isVendor ? vendorBalance(owner.vendorId, client) : currentBalance(owner.userId, client);

  try {
    const created = await db.$transaction(async (tx) => {
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
    });
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

export async function verifyAndTopUpWallet({
  transactionId,
  txRef,
  amountKobo,
}: {
  transactionId: number;
  txRef: string;
  amountKobo: number;
}): Promise<{ balance: number; ref: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;

  // Idempotency — skip re-verifying with Flutterwave if already processed
  const existing = await db.wallet.findUnique({ where: { reference: txRef } });
  if (existing) {
    return { balance: await currentBalance(userId), ref: txRef };
  }

  // Verify with Flutterwave
  let flwAmount: number;
  try {
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      },
    );
    const json = await res.json();
    const data = json.data as Record<string, unknown> | undefined;

    if (
      json.status !== "success" ||
      !data ||
      data.status !== "successful" ||
      data.currency !== "NGN" ||
      typeof data.amount !== "number"
    ) {
      return { error: "Payment verification failed." };
    }

    flwAmount = data.amount;
  } catch {
    return { error: "Could not verify payment. Please try again." };
  }

  // Tolerance of ₦1 for rounding
  if (flwAmount < amountKobo / 100 - 1) {
    return { error: "Payment amount mismatch." };
  }

  const { balance } = await creditWallet(
    { userId },
    {
      amountKobo,
      reason: "Wallet top-up",
      type: "topup",
      modelResponsible: "Payment",
      reference: txRef,
    },
  );

  return { balance, ref: txRef };
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
