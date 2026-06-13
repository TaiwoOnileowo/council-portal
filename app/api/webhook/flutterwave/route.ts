import { db } from "@/lib/db";
import { markPayoutSuccess, reversePayout } from "@/lib/payouts";
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
  const data = body.data as Record<string, unknown> | undefined;
  if (!data) return NextResponse.json({ received: true });

  if (event === "transfer.completed") {
    const reference = data.reference as string | undefined;
    const status = data.status as string | undefined;
    if (!reference) return NextResponse.json({ received: true });

    if (status === "SUCCESSFUL") {
      await markPayoutSuccess(reference);
    } else if (status === "FAILED") {
      await reversePayout(
        reference,
        (data.complete_message as string | undefined) ?? "Transfer failed.",
      );
    }
    return NextResponse.json({ received: true });
  }

  if (event !== "charge.completed") {
    return NextResponse.json({ received: true });
  }

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

  if (!txRef.startsWith("TOPUP-")) {
    return NextResponse.json({ received: true });
  }

  // Idempotency — already processed
  const existing = await db.wallet.findUnique({ where: { reference: txRef } });
  if (existing) return NextResponse.json({ received: true });

  const amountKobo = Math.round(amount * 100);

  try {
    await db.$transaction(async (tx) => {
      const latest = await tx.wallet.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        select: { balance: true },
      });
      const balance = latest?.balance ?? 0;
      await tx.wallet.create({
        data: {
          user_id: userId,
          difference: amountKobo,
          balance: balance + amountKobo,
          reason: "Wallet top-up",
          type: "topup",
          model_responsible: "Payment",
          reference: txRef,
        },
      });
    });
  } catch {
    // Unique constraint — already handled via inline callback
  }

  return NextResponse.json({ received: true });
}
