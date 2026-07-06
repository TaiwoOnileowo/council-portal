import type {
  InitiateChargeInput,
  InitiateChargeResult,
  PaymentProcessor,
  SubaccountBankDetails,
} from "./types";
import { logger } from "@/lib/logger";
import { cacheGet, cacheSet } from "@/lib/cache";

const LOG_TAG = "[paystack]";

type PaystackBank = { name: string; code: string };

const BANKS_CACHE_KEY = "paystack:banks:NG";
const BANKS_TTL = 60 * 60 * 24 * 7; // 7 days — bank lists rarely change

function normalizeBankName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Minimal edit-distance implementation — not pulling in a dependency for
// something this small. Catches spacing/word-order/minor-spelling drift
// that plain substring matching misses (e.g. "First Bank of Nigeria" vs
// "First Bank Nigeria Limited"). It does NOT catch abbreviations ("GTBank"
// vs "Guaranty Trust Bank" share almost no character sequence, so the edit
// distance is huge relative to string length) — that would need a hardcoded
// alias table, which doesn't exist yet.
function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function similarityPercent(a: string, b: string): number {
  if (!a && !b) return 100;
  if (!a || !b) return 0;
  const maxLength = Math.max(a.length, b.length);
  return Math.round(((maxLength - levenshteinDistance(a, b)) / maxLength) * 100);
}

// Only trust a fuzzy match above this bar — a low-confidence guess is worse
// than no match at all, since a wrong settlement bank sends real money to
// the wrong place, not just a cosmetic mismatch.
const FUZZY_MATCH_THRESHOLD = 85;

async function fetchPaystackBanks(): Promise<PaystackBank[] | null> {
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

async function resolvePaystackBankCode(
  bankName: string,
): Promise<string | null> {
  const banks = await fetchPaystackBanks();
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

export const paystackProcessor: PaymentProcessor = { initiateCharge };

export async function createPaystackSubaccount(
  bank: SubaccountBankDetails,
): Promise<string | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return null;

  const settlementBank = await resolvePaystackBankCode(bank.bankName);
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

export async function updatePaystackSubaccount(
  subaccountCode: string,
  bank: SubaccountBankDetails,
): Promise<boolean> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const settlementBank = await resolvePaystackBankCode(bank.bankName);
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
