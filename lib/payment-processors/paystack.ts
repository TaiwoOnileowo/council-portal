import type {
  InitiateChargeInput,
  InitiateChargeResult,
  PaymentProcessor,
} from "./types";

async function initiateCharge({
  reference,
  amountKobo,
  email,
  redirectUrl,
}: InitiateChargeInput): Promise<InitiateChargeResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { error: "Payment service is not configured." };

  try {
    const res = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference,
          amount: amountKobo, // Paystack already takes kobo, unlike Flutterwave
          email,
          currency: "NGN",
          callback_url: redirectUrl,
        }),
      },
    );

    const json = await res.json();
    if (!json.status || !json.data?.authorization_url) {
      return { error: json.message ?? "Could not start payment." };
    }
    return { authorizationUrl: json.data.authorization_url as string };
  } catch (error) {
    console.error("Error initiating Paystack charge:", error);
    return { error: "Could not start payment. Please try again." };
  }
}

export const paystackProcessor: PaymentProcessor = { initiateCharge };
