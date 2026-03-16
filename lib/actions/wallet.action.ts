"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

async function getOrCreateWallet(userId: string) {
  return db.wallet.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getWalletBalance() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const wallet = await getOrCreateWallet(session.user.id);
  return { balance: wallet.balance };
}

export async function topUpWallet(amountKobo: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (amountKobo <= 0) return { error: "Invalid amount" };

  const ref = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  const wallet = await getOrCreateWallet(session.user.id);

  const [, updatedWallet] = await db.$transaction([
    db.transaction.create({
      data: {
        walletId: wallet.id,
        type: "TOP_UP",
        status: "COMPLETED",
        amount: amountKobo,
        description: "Wallet top-up",
        ref,
      },
    }),
    db.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amountKobo } },
    }),
  ]);

  return { balance: updatedWallet.balance, ref };
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
  const existing = await db.transaction.findUnique({ where: { ref: txRef } });
  if (existing) {
    const wallet = await db.wallet.findUnique({ where: { userId } });
    return { balance: wallet?.balance ?? 0, ref: txRef };
  }

  // Verify with Flutterwave
  let flwAmount: number;
  try {
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
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

  const wallet = await getOrCreateWallet(userId);

  try {
    const [, updatedWallet] = await db.$transaction([
      db.transaction.create({
        data: {
          walletId: wallet.id,
          type: "TOP_UP",
          status: "COMPLETED",
          amount: amountKobo,
          description: "Wallet top-up",
          ref: txRef,
        },
      }),
      db.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amountKobo } },
      }),
    ]);
    return { balance: updatedWallet.balance, ref: txRef };
  } catch {
    // Unique constraint race — return current balance
    const w = await db.wallet.findUnique({ where: { userId } });
    return { balance: w?.balance ?? 0, ref: txRef };
  }
}

export async function getTransactionHistory() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", transactions: [] };

  const wallet = await db.wallet.findUnique({
    where: { userId: session.user.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  return { transactions: wallet?.transactions ?? [] };
}
