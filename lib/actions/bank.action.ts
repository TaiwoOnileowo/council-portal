"use server";

import { cacheGet, cacheSet } from "@/lib/cache";
import { logger } from "@/lib/logger";

export type Bank = {
  id: number;
  code: string;
  name: string;
};

export type VerifiedAccount = {
  accountNumber: string;
  accountName: string;
};

const BANKS_CACHE_KEY = "flutterwave:banks:NG";
const BANKS_TTL = 60 * 60 * 24 * 7;

export async function getBanks(): Promise<{ banks?: Bank[]; error?: string }> {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return { error: "Payment service is not configured." };

  const cached = await cacheGet<Bank[]>(BANKS_CACHE_KEY);
  if (cached) return { banks: cached };

  try {
    const res = await fetch("https://api.flutterwave.com/v3/banks/NG", {
      headers: { Authorization: `Bearer ${secret}` },
    });

    if (!res.ok) {
      logger.error("[banks]", "Flutterwave banks fetch not ok", {
        status: res.status,
      });
      return { error: "Failed to fetch banks. Please try again." };
    }

    const json = await res.json();
    if (json.status !== "success") {
      logger.error("[banks]", "Flutterwave banks fetch failed", {
        message: json.message,
      });
      return { error: json.message ?? "Failed to fetch banks." };
    }

    const banks = json.data as Bank[];
    await cacheSet(BANKS_CACHE_KEY, banks, BANKS_TTL);

    return { banks };
  } catch (err) {
    logger.error("[banks]", "banks fetch threw", err);
    return { error: "Failed to fetch banks. Please check your connection." };
  }
}

export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{ account?: VerifiedAccount; error?: string }> {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) return { error: "Payment service is not configured." };

  if (!/^\d{10}$/.test(accountNumber)) {
    return { error: "Account number must be exactly 10 digits." };
  }

  try {
    const res = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account_number: accountNumber, account_bank: bankCode }),
    });

    const json = await res.json();

    if (json.status !== "success") {
      return { error: json.message ?? "Could not verify account. Please check the details." };
    }

    return {
      account: {
        accountNumber: json.data.account_number,
        accountName: json.data.account_name,
      },
    };
  } catch (err) {
    // No log on the "status !== success" branch above — that's the routine
    // wrong-account-number path, not an infra problem. A thrown network
    // error here is the actual signal something's wrong with Flutterwave.
    logger.error("[banks]", "account verification threw", {
      bankCode,
      err,
    });
    return { error: "Verification failed. Please try again." };
  }
}
