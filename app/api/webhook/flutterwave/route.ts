import { db } from "@/lib/db";
import { markPayoutSuccess, reversePayout } from "@/lib/payouts";
import { creditWallet } from "@/lib/actions/wallet.action";
import {
  finalizeBookingCheckout,
  notifyBookingConfirmed,
} from "@/lib/actions/booking.action";
import { RouteFullyBookedError } from "@/lib/booking-errors";
import {
  completePaymentSuccess,
  getPaymentByReference,
  markPaymentResult,
} from "@/lib/payments";
import { walletTopupMetadataSchema } from "@/modules/wallet/wallet.types";
import { logger } from "@/lib/logger";
import type { Prisma } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

const LOG_TAG = "[flutterwave webhook]";

export async function POST(req: NextRequest) {
  // Verify Flutterwave secret hash
  const secretHash = process.env.FLW_ENCRYPTION_KEY;
  const signature = req.headers.get("verif-hash");

  if (!secretHash || signature !== secretHash) {
    logger.warn(LOG_TAG, "rejected: bad or missing verif-hash", {
      hasSecret: !!secretHash,
      hasSignature: !!signature,
    });
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (err) {
    logger.error(LOG_TAG, "rejected: invalid JSON body", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as string | undefined;
  const data = body.data as Record<string, unknown> | undefined;
  if (!data) {
    logger.warn(LOG_TAG, "event with no data payload", { event });
    return NextResponse.json({ received: true });
  }

  if (event === "transfer.completed") {
    const reference = data.reference as string | undefined;
    const status = data.status as string | undefined;
    if (!reference) {
      logger.warn(LOG_TAG, "transfer.completed missing reference", {
        fields: Object.keys(data),
      });
      return NextResponse.json({ received: true });
    }

    if (status === "SUCCESSFUL") {
      try {
        await markPayoutSuccess(reference);
        logger.info(LOG_TAG, "payout marked successful", { reference });
      } catch (err) {
        logger.error(LOG_TAG, "markPayoutSuccess threw", { reference, err });
        return NextResponse.json(
          { error: "Processing failed" },
          { status: 500 },
        );
      }
    } else if (status === "FAILED") {
      const reason =
        (data.complete_message as string | undefined) ?? "Transfer failed.";
      try {
        await reversePayout(reference, reason);
        logger.info(LOG_TAG, "payout reversed", { reference, reason });
      } catch (err) {
        logger.error(LOG_TAG, "reversePayout threw", { reference, err });
        return NextResponse.json(
          { error: "Processing failed" },
          { status: 500 },
        );
      }
    } else {
      logger.warn(LOG_TAG, "transfer.completed with unhandled status", {
        reference,
        status,
      });
    }
    return NextResponse.json({ received: true });
  }

  if (event !== "charge.completed") {
    logger.warn(LOG_TAG, "ignoring unhandled event type", { event });
    return NextResponse.json({ received: true });
  }

  const txRef = data.tx_ref as string | undefined;
  const status = data.status as string | undefined;
  const amount = data.amount as number | undefined;
  const currency = data.currency as string | undefined;

  if (!txRef) {
    logger.warn(LOG_TAG, "charge.completed missing tx_ref", {
      fields: Object.keys(data),
    });
    return NextResponse.json({ received: true });
  }

  const amountKobo = amount ? Math.round(amount * 100) : 0;
  const isSuccessful =
    status === "successful" && currency === "NGN" && !!amount;
  const flwRef = data.flw_ref as string | undefined;

  logger.info(LOG_TAG, "charge.completed", {
    txRef,
    status,
    amount,
    currency,
    isSuccessful,
  });

  // Static virtual account credit — Flutterwave echoes back the tx_ref we
  // supplied when the account was created, not a per-transfer one, so we
  // look up the owner by that instead of a payment row.
  if (txRef.startsWith("VA-")) {
    if (!isSuccessful) return NextResponse.json({ received: true });

    const virtualAccount = await db.virtual_account.findUnique({
      where: { tx_ref: txRef },
    });
    if (!virtualAccount) {
      logger.error(LOG_TAG, "unattributed virtual account transfer", {
        txRef,
        flwRef,
        amount,
      });
      return NextResponse.json({ received: true });
    }

    const creditRef = flwRef || String(data.id ?? "");
    if (!creditRef) {
      logger.warn(LOG_TAG, "VA transfer missing flw_ref/id, cannot credit", {
        txRef,
      });
      return NextResponse.json({ received: true });
    }

    const owner = virtualAccount.vendor_id
      ? { vendorId: virtualAccount.vendor_id }
      : { userId: virtualAccount.user_id! };

    try {
      await creditWallet(owner, {
        amountKobo,
        reason: "Wallet top-up — bank transfer",
        type: "topup",
        modelResponsible: "VirtualAccount",
        reference: creditRef,
      });
      logger.info(LOG_TAG, "VA wallet credited", {
        txRef,
        creditRef,
        owner,
        amountKobo,
      });
    } catch (err) {
      logger.error(LOG_TAG, "creditWallet threw for VA transfer", {
        txRef,
        creditRef,
        owner,
        amountKobo,
        err,
      });
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  // Everything else is a payment we started ourselves via startPayment —
  // look it up by reference rather than trusting anything client-supplied,
  // and only ever act on it once (a webhook can be retried by Flutterwave).
  const payment = await getPaymentByReference(txRef);
  if (!payment) {
    logger.warn(LOG_TAG, "no payment row found for tx_ref", { txRef });
    return NextResponse.json({ received: true });
  }
  if (payment.status !== "PENDING") {
    logger.info(LOG_TAG, "ignoring webhook for non-pending payment", {
      txRef,
      currentStatus: payment.status,
    });
    return NextResponse.json({ received: true });
  }

  if (!isSuccessful || amountKobo < payment.amount) {
    const failureReason = !isSuccessful
      ? `Flutterwave reported status "${status}"`
      : "Amount mismatch";
    logger.warn(LOG_TAG, "marking payment FAILED", {
      txRef,
      failureReason,
      amountKobo,
      expectedAmount: payment.amount,
    });
    await markPaymentResult(txRef, {
      status: "FAILED",
      failureReason,
      processorReference: flwRef,
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
        processorReference: flwRef,
        rawResponse: body as unknown as Prisma.InputJsonValue,
      },
      async (tx) => {
        if (payment.destination === "wallet_topup") {
          const parsedMeta = walletTopupMetadataSchema.safeParse(
            payment.metadata,
          );
          const creditKobo = parsedMeta.success
            ? parsedMeta.data.requestedAmountKobo
            : payment.amount;

          await creditWallet(
            { userId: payment.user_id },
            {
              amountKobo: creditKobo,
              reason: "Wallet top-up",
              type: "topup",
              modelResponsible: "Payment",
              reference: txRef,
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
      logger.info(LOG_TAG, "duplicate delivery, already finalized", {
        txRef,
      });
    } else if (result.kind === "wallet_topup") {
      logger.info(LOG_TAG, "wallet credited for payment", { txRef });
    } else if (result.kind === "booking") {
      logger.info(LOG_TAG, "booking checkout finalized", { txRef });
      notifyBookingConfirmed(payment.user_id, txRef, result.meta).catch((err) =>
        logger.error(LOG_TAG, "booking confirmation email failed", {
          txRef,
          err,
        }),
      );
    } else {
      logger.error(
        LOG_TAG,
        "payment marked SUCCESS but destination is unrecognized — nothing credited",
        { txRef, destination: payment.destination },
      );
    }
  } catch (err) {
    if (err instanceof RouteFullyBookedError) {
      await markPaymentResult(txRef, {
        status: "FAILED",
        failureReason: "Route fully booked — needs manual refund",
      });
      logger.error(
        LOG_TAG,
        "booking failed: route fully booked, payment needs manual refund",
        {
          txRef,
        },
      );
      return NextResponse.json({ received: true });
    }
    logger.error(
      LOG_TAG,
      "payment success processing failed — rolled back, payment remains PENDING for retry",
      { txRef, destination: payment.destination, err },
    );
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
