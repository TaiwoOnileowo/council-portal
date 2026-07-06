import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getSetting } from "@/lib/settings";
import { SETTINGS_REGISTRY } from "@/lib/settings.constant";
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
  // Caller-resolved: the subaccount id must match whichever processor turns
  // out to be active, so the caller (who knows the destination's vendor)
  // looks it up per-processor ahead of time. See startBookingCheckout.
  split?: {
    subaccountId: string;
    vendorPayoutKobo: number;
    platformFeeKobo: number;
  };
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
  split,
}: StartPaymentInput): Promise<
  { authorizationUrl: string; reference: string } | { error: string }
> {
  const { activeProcessor: processor } = await getSetting("payment_config");
  // getSetting already validates against the registry's enum, so this
  // should always resolve — but if a new enum member is ever added without
  // registering its processor, fall back to the default rather than
  // failing every payment outright.
  const implementation =
    PAYMENT_PROCESSORS[processor] ??
    PAYMENT_PROCESSORS[SETTINGS_REGISTRY.payment_config.default.activeProcessor];
  if (!implementation) {
    return { error: "Payment service is not configured correctly." };
  }

  const result = await implementation.initiateCharge({
    reference,
    amountKobo,
    email,
    name,
    redirectUrl,
    split,
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
// reference should be a silent no-op, not a re-credit. Returns whether this
// call actually made the transition, so a caller acting on SUCCESS (crediting
// a wallet, creating a booking) knows whether to run that action at all.
export async function markPaymentResult(
  reference: string,
  result: PaymentResult,
  client: Prisma.TransactionClient | typeof db = db,
): Promise<boolean> {
  const { count } = await client.payment.updateMany({
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
  return count > 0;
}

// Marks a payment SUCCESS and runs its destination-specific action in the
// same transaction, so a crash or error between the two can never leave a
// payment marked SUCCESS with the credit/booking never applied — the whole
// transaction rolls back and the payment stays PENDING for a retry to pick
// up cleanly. Returns null if this call lost the race (already handled);
// otherwise whatever onSuccess returns.
export async function completePaymentSuccess<T>(
  payment: { reference: string },
  processorMeta: {
    processorReference?: string;
    rawResponse?: Prisma.InputJsonValue;
  },
  onSuccess: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T | null> {
  return db.$transaction(async (tx) => {
    const transitioned = await markPaymentResult(
      payment.reference,
      { status: "SUCCESS", ...processorMeta },
      tx,
    );
    if (!transitioned) return null;
    return onSuccess(tx);
  });
}
