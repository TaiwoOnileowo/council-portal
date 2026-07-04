import { db } from "@/lib/db";
import { markPayoutSuccess, reversePayout } from "@/lib/payouts";
import { creditWallet } from "@/lib/actions/wallet.action";
import { getPaymentByReference, markPaymentResult } from "@/lib/payments";
import type { Prisma } from "@/generated/prisma/client";
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

  if (!txRef) return NextResponse.json({ received: true });

  const amountKobo = amount ? Math.round(amount * 100) : 0;
  const isSuccessful =
    status === "successful" && currency === "NGN" && !!amount;
  const flwRef = data.flw_ref as string | undefined;

  // Static virtual account credit — Flutterwave echoes back the tx_ref we
  // supplied when the account was created, not a per-transfer one, so we
  // look up the owner by that instead of a payment row.
  if (txRef.startsWith("VA-")) {
    if (!isSuccessful) return NextResponse.json({ received: true });

    const virtualAccount = await db.virtual_account.findUnique({
      where: { tx_ref: txRef },
    });
    if (!virtualAccount) {
      console.error(
        "[flutterwave webhook] unattributed virtual account transfer",
        { txRef, flwRef, amount },
      );
      return NextResponse.json({ received: true });
    }

    const creditRef = flwRef || String(data.id ?? "");
    if (!creditRef) return NextResponse.json({ received: true });

    const owner = virtualAccount.vendor_id
      ? { vendorId: virtualAccount.vendor_id }
      : { userId: virtualAccount.user_id! };

    await creditWallet(owner, {
      amountKobo,
      reason: "Wallet top-up — bank transfer",
      type: "topup",
      modelResponsible: "VirtualAccount",
      reference: creditRef,
    });

    return NextResponse.json({ received: true });
  }

  // Everything else is a payment we started ourselves via startPayment —
  // look it up by reference rather than trusting anything client-supplied,
  // and only ever act on it once (a webhook can be retried by Flutterwave).
  const payment = await getPaymentByReference(txRef);
  if (!payment || payment.status !== "PENDING") {
    return NextResponse.json({ received: true });
  }

  if (!isSuccessful || amountKobo < payment.amount) {
    await markPaymentResult(txRef, {
      status: "FAILED",
      failureReason: !isSuccessful
        ? `Flutterwave reported status "${status}"`
        : "Amount mismatch",
      processorReference: flwRef,
      rawResponse: body as unknown as Prisma.InputJsonValue,
    });
    return NextResponse.json({ received: true });
  }

  await markPaymentResult(txRef, {
    status: "SUCCESS",
    processorReference: flwRef,
    rawResponse: body as unknown as Prisma.InputJsonValue,
  });

  if (payment.destination === "wallet_topup") {
    await creditWallet(
      { userId: payment.user_id },
      {
        amountKobo: payment.amount,
        reason: "Wallet top-up",
        type: "topup",
        modelResponsible: "Payment",
        reference: txRef,
      },
    );
  }
  // Other destinations (e.g. "booking") aren't implemented yet.

  return NextResponse.json({ received: true });
}
