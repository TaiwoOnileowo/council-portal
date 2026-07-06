import type {
  InitiateChargeInput,
  InitiateChargeResult,
  SubaccountBankDetails,
} from "./types";
import { logger } from "@/lib/logger";
import { cacheGet, cacheSet } from "@/lib/cache";
import { similarityPercent } from "@/lib/utils";

const LOG_TAG = "[paystack]";

type PaystackBank = { name: string; code: string };

const BANKS_CACHE_KEY = "paystack:banks:NG";
const BANKS_TTL = 60 * 60 * 24 * 7; // 7 days — bank lists rarely change

function normalizeBankName(name: string): string {
  // Paystack's list broadly abbreviates "Microfinance Bank" to "MFB" (e.g.
  // "Moniepoint MFB", "Aella MFB", "FCMB MFB" — confirmed live) while our
  // stored names (sourced from Flutterwave) spell it out (e.g. "Moniepoint
  // Microfinance Bank"). Collapsing both forms to "mfb" turns this into an
  // exact match instead of relying on the substring/fuzzy tiers below.
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/microfinancebank/g, "mfb");
}

// Only trust a fuzzy match above this bar — a low-confidence guess is worse
// than no match at all, since a wrong settlement bank sends real money to
// the wrong place, not just a cosmetic mismatch.
const FUZZY_MATCH_THRESHOLD = 85;

async function fetchBanks(): Promise<PaystackBank[] | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return null;

  const cached = await cacheGet<PaystackBank[]>(BANKS_CACHE_KEY);
  if (cached) return cached;

  try {
    const res = await fetch(
      "https://api.paystack.co/bank?country=nigeria&currency=NGN",
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const json = await res.json();
    if (!json.status || !Array.isArray(json.data)) {
      logger.error(LOG_TAG, "banks fetch failed", { response: json });
      return null;
    }

    const banks: PaystackBank[] = json.data.map(
      (b: { name: string; code: string }) => ({ name: b.name, code: b.code }),
    );
    await cacheSet(BANKS_CACHE_KEY, banks, BANKS_TTL);
    return banks;
  } catch (err) {
    logger.error(LOG_TAG, "banks fetch threw", { err });
    return null;
  }
}

async function resolveBankCode(bankName: string): Promise<string | null> {
  const banks = await fetchBanks();
  if (!banks) return null;

  const target = normalizeBankName(bankName);

  const exact = banks.find((b) => normalizeBankName(b.name) === target);
  if (exact) return exact.code;

  const partial = banks.find((b) => {
    const normalized = normalizeBankName(b.name);
    return normalized.includes(target) || target.includes(normalized);
  });
  if (partial) return partial.code;

  let best: { code: string; score: number } | null = null;
  for (const b of banks) {
    const score = similarityPercent(target, normalizeBankName(b.name));
    if (score >= FUZZY_MATCH_THRESHOLD && (!best || score > best.score)) {
      best = { code: b.code, score };
    }
  }
  return best?.code ?? null;
}

async function initiateCharge({
  reference,
  amountKobo,
  email,
  redirectUrl,
  split,
}: InitiateChargeInput): Promise<InitiateChargeResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { error: "Payment service is not configured." };

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
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
        ...(split && {
          subaccount: split.subaccountId,
          transaction_charge: split.platformFeeKobo,
        }),
      }),
    });

    const json = await res.json();
    if (!json.status || !json.data?.authorization_url) {
      logger.error(LOG_TAG, "charge initiation rejected", {
        reference,
        hasSplit: !!split,
        response: json,
      });
      return { error: json.message ?? "Could not start payment." };
    }
    return { authorizationUrl: json.data.authorization_url as string };
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
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return null;

  const settlementBank = await resolveBankCode(bank.bankName);
  if (!settlementBank) {
    logger.error(LOG_TAG, "could not resolve bank name to a Paystack code", {
      bank,
    });
    return null;
  }

  try {
    const res = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: bank.businessName,
        settlement_bank: settlementBank,
        account_number: bank.accountNumber,
        percentage_charge: 100,
      }),
    });

    const json = await res.json();
    if (!json.status || !json.data?.subaccount_code) {
      logger.error(LOG_TAG, "subaccount creation failed", {
        bank,
        response: json,
      });
      return null;
    }
    return json.data.subaccount_code as string;
  } catch (err) {
    logger.error(LOG_TAG, "subaccount creation threw", { bank, err });
    return null;
  }
}

async function updateSubaccount(
  subaccountCode: string,
  bank: SubaccountBankDetails,
): Promise<boolean> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const settlementBank = await resolveBankCode(bank.bankName);
  if (!settlementBank) {
    logger.error(LOG_TAG, "could not resolve bank name to a Paystack code", {
      subaccountCode,
      bank,
    });
    return false;
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/subaccount/${subaccountCode}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: bank.businessName,
          settlement_bank: settlementBank,
          account_number: bank.accountNumber,
        }),
      },
    );

    const json = await res.json();
    if (!json.status) {
      logger.error(LOG_TAG, "subaccount update failed", {
        subaccountCode,
        bank,
        response: json,
      });
      return false;
    }
    return true;
  } catch (err) {
    logger.error(LOG_TAG, "subaccount update threw", {
      subaccountCode,
      bank,
      err,
    });
    return false;
  }
}

export const paystackService = { initiateCharge, createSubaccount, updateSubaccount };
