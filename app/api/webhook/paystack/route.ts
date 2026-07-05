import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  completePaymentSuccess,
  getPaymentByReference,
  markPaymentResult,
} from "@/lib/payments";
import { creditWallet } from "@/lib/actions/wallet.action";
import {
  finalizeBookingCheckout,
  notifyBookingConfirmed,
} from "@/lib/actions/booking.action";
import type { Prisma } from "@/generated/prisma/client";

function isValidSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;

  return timingSafeEqual(expectedBuf, signatureBuf);
}

const LOG_TAG = "[paystack webhook]";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!isValidSignature(rawBody, signature)) {
    console.warn(LOG_TAG, "rejected: invalid x-paystack-signature", {
      hasSignature: !!signature,
    });
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error(LOG_TAG, "rejected: invalid JSON body", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as string | undefined;
  const data = body.data as Record<string, unknown> | undefined;
  if (event !== "charge.success" || !data) {
    return NextResponse.json({ received: true });
  }

  const reference = data.reference as string | undefined;
  const status = data.status as string | undefined;
  const amountKobo = data.amount as number | undefined; // already kobo
  const currency = data.currency as string | undefined;

  if (!reference) {
    console.warn(LOG_TAG, "charge.success missing reference", {
      fields: Object.keys(data),
    });
    return NextResponse.json({ received: true });
  }

  const isSuccessful =
    status === "success" && currency === "NGN" && !!amountKobo;
  const processorReference = String(data.id ?? "");

  console.log(LOG_TAG, "charge.success", {
    reference,
    status,
    amountKobo,
    currency,
    isSuccessful,
  });

  const payment = await getPaymentByReference(reference);
  if (!payment) {
    console.warn(LOG_TAG, "no payment row found for reference", {
      reference,
    });
    return NextResponse.json({ received: true });
  }
  if (payment.status !== "PENDING") {
    console.log(LOG_TAG, "ignoring webhook for non-pending payment", {
      reference,
      currentStatus: payment.status,
    });
    return NextResponse.json({ received: true });
  }

  if (!isSuccessful || (amountKobo ?? 0) < payment.amount) {
    const failureReason = !isSuccessful
      ? `Paystack reported status "${status}"`
      : "Amount mismatch";
    console.warn(LOG_TAG, "marking payment FAILED", {
      reference,
      failureReason,
      amountKobo,
      expectedAmount: payment.amount,
    });
    await markPaymentResult(reference, {
      status: "FAILED",
      failureReason,
      processorReference,
      rawResponse: body as unknown as Prisma.InputJsonValue,
    });
    return NextResponse.json({ received: true });
  }

  // Marking the payment SUCCESS and crediting/creating its destination
  // happen in one transaction — a throw here rolls both back, leaving the
  // payment PENDING so a retried webhook delivery can safely finish the job
  // instead of finding it already SUCCESS with nothing actually settled.
  try {
    const result = await completePaymentSuccess(
      payment,
      {
        processorReference,
        rawResponse: body as unknown as Prisma.InputJsonValue,
      },
      async (tx) => {
        if (payment.destination === "wallet_topup") {
          await creditWallet(
            { userId: payment.user_id },
            {
              amountKobo: payment.amount,
              reason: "Wallet top-up",
              type: "topup",
              modelResponsible: "Payment",
              reference,
            },
            tx,
          );
          return { kind: "wallet_topup" as const };
        }
        if (payment.destination === "booking") {
          return {
            kind: "booking" as const,
            meta: await finalizeBookingCheckout(payment, tx),
          };
        }
        return { kind: "unknown" as const };
      },
    );

    if (!result) {
      // markPaymentResult lost the race (another delivery already handled
      // this reference) — a normal, harmless outcome of processor retries.
      console.log(LOG_TAG, "duplicate delivery, already finalized", {
        reference,
      });
    } else if (result.kind === "wallet_topup") {
      console.log(LOG_TAG, "wallet credited for payment", { reference });
    } else if (result.kind === "booking") {
      console.log(LOG_TAG, "booking checkout finalized", { reference });
      notifyBookingConfirmed(payment.user_id, reference, result.meta).catch(
        (err) =>
          console.error(LOG_TAG, "booking confirmation email failed", {
            reference,
            err,
          }),
      );
    } else {
      console.error(
        LOG_TAG,
        "payment marked SUCCESS but destination is unrecognized — nothing credited",
        { reference, destination: payment.destination },
      );
    }
  } catch (err) {
    console.error(
      LOG_TAG,
      "payment success processing failed — rolled back, payment remains PENDING for retry",
      { reference, destination: payment.destination, err },
    );
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
