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
