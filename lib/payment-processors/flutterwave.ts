import type {
  InitiateChargeInput,
  InitiateChargeResult,
  SubaccountBankDetails,
} from "./types";
import { logger } from "@/lib/logger";

const LOG_TAG = "[flutterwave]";

async function initiateCharge({
  reference,
  amountKobo,
  email,
  name,
  redirectUrl,
  split,
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
        // flat_subaccount fixes the SUBACCOUNT's cut, not ours — deliberate:
        // Flutterwave has no bearer-style toggle for who eats its own fee,
        // so whichever side is "the remainder" absorbs it. Fixing the
        // vendor's payout here means our cut is the remainder instead,
        // guaranteeing the vendor gets exactly fare - commission regardless
        // of Flutterwave's fee, at the cost of our own margin absorbing it.
        ...(split && {
          subaccounts: [
            {
              id: split.subaccountId,
              transaction_charge_type: "flat_subaccount",
              transaction_charge: split.vendorPayoutKobo / 100, // naira, not kobo
            },
          ],
        }),
      }),
    });

    const json = await res.json();
    if (json.status !== "success" || !json.data?.link) {
      logger.error(LOG_TAG, "charge initiation rejected", {
        reference,
        hasSplit: !!split,
        response: json,
      });
      return { error: json.message ?? "Could not start payment." };
    }
    return { authorizationUrl: json.data.link as string };
  } catch (error) {
    logger.error(LOG_TAG, "error initiating charge", {
      reference,
      error,
    });
    return { error: "Could not start payment. Please try again." };
  }
}

async function createSubaccount(
  bank: SubaccountBankDetails,
): Promise<string | null> {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return null;

  try {
    const res = await fetch("https://api.flutterwave.com/v3/subaccounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_bank: bank.bankCode,
        account_number: bank.accountNumber,
        business_name: bank.businessName,
        business_mobile: bank.businessMobile,
        business_email: bank.businessEmail,
        country: "NG",
        // split_value here is the SUBACCOUNT's cut, not ours — confirmed by
        // Flutterwave's own worked example ("flat: the subaccount receives
        // a fixed amount, and you get the remainder"). Every real charge
        // overrides this via a per-transaction `transaction_charge_type:
        // "flat"` override anyway, so this default is inert — but if it
        // were ever hit, 100% means the vendor gets everything and we get
        // nothing, rather than the reverse.
        split_type: "percentage",
        split_value: 1,
      }),
    });

    const json = await res.json();
    if (json.status !== "success" || !json.data?.subaccount_id) {
      logger.error(LOG_TAG, "subaccount creation failed", {
        bank,
        response: json,
      });
      return null;
    }
    return json.data.subaccount_id as string;
  } catch (err) {
    logger.error(LOG_TAG, "subaccount creation threw", { bank, err });
    return null;
  }
}

async function updateSubaccount(
  subaccountId: string,
  bank: SubaccountBankDetails,
): Promise<boolean> {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return false;

  try {
    const res = await fetch(
      `https://api.flutterwave.com/v3/subaccounts/${subaccountId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_bank: bank.bankCode,
          account_number: bank.accountNumber,
          business_name: bank.businessName,
          business_email: bank.businessEmail,
          // Required on update (unlike create, this has no documented
          // default) — same inert, vendor-favoring value as create, since
          // every real charge overrides the split per-transaction anyway.
          split_type: "percentage",
          split_value: 1,
        }),
      },
    );

    const json = await res.json();
    if (json.status !== "success") {
      logger.error(LOG_TAG, "subaccount update failed", {
        subaccountId,
        bank,
        response: json,
      });
      return false;
    }
    return true;
  } catch (err) {
    logger.error(LOG_TAG, "subaccount update threw", {
      subaccountId,
      bank,
      err,
    });
    return false;
  }
}

export const flutterwaveService = { initiateCharge, createSubaccount, updateSubaccount };
