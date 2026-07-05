import type {
  InitiateChargeInput,
  InitiateChargeResult,
  PaymentProcessor,
} from "./types";

async function initiateCharge({
  reference,
  amountKobo,
  email,
  name,
  redirectUrl,
}: InitiateChargeInput): Promise<InitiateChargeResult> {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return { error: "Payment service is not configured." };

  try {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: amountKobo / 100, // Flutterwave takes naira, not kobo
        currency: "NGN",
        redirect_url: redirectUrl,
        customer: { email, name },
        customizations: {
          title: "Council Portal",
          description: "Wallet top-up",
        },
      }),
    });

    const json = await res.json();
    if (json.status !== "success" || !json.data?.link) {
      return { error: json.message ?? "Could not start payment." };
    }
    return { authorizationUrl: json.data.link as string };
  } catch (error) {
    console.error("Error initiating Flutterwave charge:", error);
    return { error: "Could not start payment. Please try again." };
  }
}

export const flutterwaveProcessor: PaymentProcessor = { initiateCharge };
