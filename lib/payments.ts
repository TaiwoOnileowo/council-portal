import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getSetting } from "@/lib/settings";
import { PAYMENT_PROCESSORS } from "@/lib/payment-processors";

export type StartPaymentInput = {
  reference: string;
  amountKobo: number;
  userId: string;
  destination: string; // free-text, e.g. "wallet_topup" — mirrors wallet.model_responsible
  email: string;
  name: string;
  redirectUrl: string;
  metadata?: Prisma.InputJsonValue;
};

export async function startPayment({
  reference,
  amountKobo,
  userId,
  destination,
  email,
  name,
  redirectUrl,
  metadata,
}: StartPaymentInput): Promise<
  { authorizationUrl: string; reference: string } | { error: string }
> {
  const processor = await getSetting("active_payment_processor");
  const implementation = PAYMENT_PROCESSORS[processor];
  if (!implementation) {
    return { error: "Payment service is not configured correctly." };
  }

  const result = await implementation.initiateCharge({
    reference,
    amountKobo,
    email,
    name,
    redirectUrl,
  });

  if ("error" in result) return result;

  await db.payment.create({
    data: {
      reference,
      processor,
      amount: amountKobo,
      destination,
      user_id: userId,
      metadata,
    },
  });

  return { authorizationUrl: result.authorizationUrl, reference };
}

export async function getPaymentByReference(reference: string) {
  return db.payment.findUnique({ where: { reference } });
}

type PaymentResult =
  | {
      status: "SUCCESS";
      processorReference?: string;
      rawResponse?: Prisma.InputJsonValue;
    }
  | {
      status: "FAILED";
      failureReason: string;
      processorReference?: string;
      rawResponse?: Prisma.InputJsonValue;
    };

// Only ever transitions a payment still in PENDING — a processor webhook can
// and will retry delivery, and a second call for an already-terminal
// reference should be a silent no-op, not a re-credit.
export async function markPaymentResult(
  reference: string,
  result: PaymentResult,
): Promise<void> {
  await db.payment.updateMany({
    where: { reference, status: "PENDING" },
    data: {
      status: result.status,
      processor_reference: result.processorReference,
      raw_response: result.rawResponse,
      ...(result.status === "SUCCESS"
        ? { paid_at: new Date() }
        : { failure_reason: result.failureReason }),
    },
  });
}
