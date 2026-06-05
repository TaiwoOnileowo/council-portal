import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Verify Flutterwave secret hash
  const secretHash = process.env.FLW_ENCRYPTION_KEY;
  const signature = req.headers.get("verif-hash");

  if (!secretHash || signature !== secretHash) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as string | undefined;
  if (event !== "charge.completed") {
    return NextResponse.json({ received: true });
  }

  const data = body.data as Record<string, unknown> | undefined;
  if (!data) return NextResponse.json({ received: true });

  const txRef = data.tx_ref as string | undefined;
  const status = data.status as string | undefined;
  const amount = data.amount as number | undefined;
  const currency = data.currency as string | undefined;
  const meta = data.meta as Record<string, unknown> | undefined;
  const userId = meta?.userId as string | undefined;

  if (
    !txRef ||
    !userId ||
    status !== "successful" ||
    currency !== "NGN" ||
    !amount
  ) {
    return NextResponse.json({ received: true });
  }

  // Only handle top-up refs (booking payment goes through wallet action inline)
  if (!txRef.startsWith("TOPUP-")) {
    return NextResponse.json({ received: true });
  }

  // Idempotency — already processed
  const existing = await db.transaction.findUnique({ where: { ref: txRef } });
  if (existing) return NextResponse.json({ received: true });

  const amountKobo = Math.round(amount * 100);

  const wallet = await db.wallet.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  try {
    await db.$transaction([
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
  } catch {
    // Unique constraint — already handled via inline callback
  }

  return NextResponse.json({ received: true });
}
