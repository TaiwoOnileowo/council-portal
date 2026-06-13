"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  WALLET_TX_PAGE_SIZE,
  type WalletTransactionsFilters,
  type WalletTransactionsResponse,
} from "@/modules/wallet/wallet.types";

async function currentBalance(
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

export async function getWalletBalance() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const isVendor = session.user.role === "VENDOR";
  const where = isVendor
    ? { vendor_id: session.user.id }
    : { user_id: session.user.id };

  const latest = await db.wallet.findFirst({
    where,
    orderBy: { created_at: "desc" },
    select: { balance: true },
  });

  return { balance: latest?.balance ?? 0 };
}

export async function topUpWallet(amountKobo: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (amountKobo <= 0) return { error: "Invalid amount" };

  const userId = session.user.id;
  const ref = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  const entry = await db.$transaction(async (tx) => {
    const balance = await currentBalance(userId, tx);
    return tx.wallet.create({
      data: {
        user_id: userId,
        difference: amountKobo,
        balance: balance + amountKobo,
        reason: "Wallet top-up",
        type: "topup",
        model_responsible: "Payment",
        reference: ref,
      },
      select: { balance: true },
    });
  });

  return { balance: entry.balance, ref };
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

  // Idempotency — already processed
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

  try {
    const entry = await db.$transaction(async (tx) => {
      const balance = await currentBalance(userId, tx);
      return tx.wallet.create({
        data: {
          user_id: userId,
          difference: amountKobo,
          balance: balance + amountKobo,
          reason: "Wallet top-up",
          type: "topup",
          model_responsible: "Payment",
          reference: txRef,
        },
        select: { balance: true },
      });
    });
    return { balance: entry.balance, ref: txRef };
  } catch {
    // Unique constraint race — already processed
    return { balance: await currentBalance(userId), ref: txRef };
  }
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
