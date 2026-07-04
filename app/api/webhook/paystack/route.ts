import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPaymentByReference, markPaymentResult } from "@/lib/payments";
import { creditWallet } from "@/lib/actions/wallet.action";
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

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
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

  if (!reference) return NextResponse.json({ received: true });

  const isSuccessful =
    status === "success" && currency === "NGN" && !!amountKobo;
  const processorReference = String(data.id ?? "");

  const payment = await getPaymentByReference(reference);
  if (!payment || payment.status !== "PENDING") {
    return NextResponse.json({ received: true });
  }

  if (!isSuccessful || (amountKobo ?? 0) < payment.amount) {
    await markPaymentResult(reference, {
      status: "FAILED",
      failureReason: !isSuccessful
        ? `Paystack reported status "${status}"`
        : "Amount mismatch",
      processorReference,
      rawResponse: body as unknown as Prisma.InputJsonValue,
    });
    return NextResponse.json({ received: true });
  }

  await markPaymentResult(reference, {
    status: "SUCCESS",
    processorReference,
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
        reference,
      },
    );
  }
  // Other destinations (e.g. "booking") aren't implemented yet.

  return NextResponse.json({ received: true });
}
