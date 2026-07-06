import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { syncVendorSubaccounts } from "@/lib/vendor-subaccounts";
import { logger } from "@/lib/logger";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_KEY;
  if (!secret) return false;

  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  const secretBuf = Buffer.from(secret);
  const providedBuf = Buffer.from(provided);
  if (secretBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(secretBuf, providedBuf);
}

// One-time (or re-runnable) sync for vendors who had bank details on file
// before subaccount creation existed — signUpVendor/updateVendorProfile only
// trigger syncVendorSubaccounts on their own paths, so anyone who never
// touched either since this feature shipped is missing a subaccount.
// syncVendorSubaccounts swallows and logs (+ alerts) per-processor failures
// internally, so success here just means "attempted" — the real signal is
// the stillMissing list below, re-queried after every attempt completes.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    logger.warn("[vendor-subaccounts]", "unauthorized backfill attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendors = await db.vendor_profile.findMany({
    where: {
      bank_code: { not: null },
      account_number: { not: null },
      OR: [
        { paystack_subaccount_code: null },
        { flutterwave_subaccount_id: null },
      ],
    },
    select: { user_id: true },
  });

  // Sequential on purpose — this hits Paystack and Flutterwave per vendor
  // (each already parallelized internally by syncVendorSubaccounts); no
  // reason to burst a whole vendor list's worth of external calls at once.
  for (const vendor of vendors) {
    await syncVendorSubaccounts(vendor.user_id);
  }

  const stillMissing = await db.vendor_profile.findMany({
    where: {
      user_id: { in: vendors.map((v) => v.user_id) },
      OR: [
        { paystack_subaccount_code: null },
        { flutterwave_subaccount_id: null },
      ],
    },
    select: {
      user_id: true,
      paystack_subaccount_code: true,
      flutterwave_subaccount_id: true,
    },
  });

  logger.info("[vendor-subaccounts]", "backfill run complete", {
    attempted: vendors.length,
    stillMissing: stillMissing.length,
  });

  return NextResponse.json({
    attempted: vendors.length,
    stillMissing: stillMissing.map((v) => ({
      vendorId: v.user_id,
      missingPaystack: !v.paystack_subaccount_code,
      missingFlutterwave: !v.flutterwave_subaccount_id,
    })),
  });
}
