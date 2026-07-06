"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export type VirtualAccountDetails = {
  accountNumber: string;
  bankName: string;
};

export async function getOrCreateVirtualAccount(): Promise<
  { ok: true; data: VirtualAccountDetails } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const isVendor = session.user.role === "VENDOR";
  const ownerId = session.user.id;
  const ownerWhere = isVendor ? { vendor_id: ownerId } : { user_id: ownerId };

  const existing = await db.virtual_account.findUnique({ where: ownerWhere });
  if (existing?.is_active) {
    return {
      ok: true,
      data: {
        accountNumber: existing.account_number,
        bankName: existing.bank_name,
      },
    };
  }

  const otherWhere = isVendor ? { user_id: ownerId } : { vendor_id: ownerId };
  const otherExisting = await db.virtual_account.findUnique({
    where: otherWhere,
  });
  if (otherExisting) {
    return {
      ok: false,
      error:
        "This account already has a virtual account under a different role.",
    };
  }

  const secret = process.env.FLW_SECRET_KEY;
  const bvn = process.env.FLW_PLATFORM_BVN;
  if (!secret || !bvn)
    return { ok: false, error: "Payment service is not configured." };

  const user = await db.user.findUnique({
    where: { id: ownerId },
    select: { first_name: true, last_name: true, email: true, phone: true },
  });
  if (!user) return { ok: false, error: "User not found." };

  // A fresh tx_ref per (re)provisioning call — Flutterwave keys the account to
  // it, and re-submitting an old value would collide with the retired account.
  const txRef = `VA-${ownerId}-${Date.now().toString(36)}`;

  try {
    const res = await fetch(
      "https://api.flutterwave.com/v3/virtual-account-numbers",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          bvn,
          is_permanent: true,
          tx_ref: txRef,
          phonenumber: user.phone,
          firstname: user.first_name,
          lastname: user.last_name,
          narration: `Council Portal - ${user.first_name} ${user.last_name}`,
        }),
      },
    );

    const json = await res.json();
    if (json.status !== "success" || !json.data?.account_number) {
      logger.error("[virtual-account]", "Flutterwave VA creation failed", {
        ownerId,
        isVendor,
        message: json.message,
      });
      return {
        ok: false,
        error: json.message ?? "Could not create virtual account.",
      };
    }

    const accountNumber = json.data.account_number as string;
    const bankName = json.data.bank_name as string;
    const bankCode = json.data.bank_code as string | undefined;

    const account = await db.virtual_account.upsert({
      where: ownerWhere,
      update: {
        account_number: accountNumber,
        bank_name: bankName,
        bank_code: bankCode,
        tx_ref: txRef,
        is_active: true,
      },
      create: {
        ...ownerWhere,
        account_number: accountNumber,
        bank_name: bankName,
        bank_code: bankCode,
        tx_ref: txRef,
      },
    });

    return {
      ok: true,
      data: {
        accountNumber: account.account_number,
        bankName: account.bank_name,
      },
    };
  } catch (err) {
    logger.error("[virtual-account]", "getOrCreateVirtualAccount threw", {
      ownerId,
      isVendor,
      err,
    });
    return {
      ok: false,
      error: "Could not create virtual account. Please try again.",
    };
  }
}
