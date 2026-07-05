import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { nairaToKobo } from "@/lib/money";
import { vendorBalance } from "@/lib/actions/wallet.action";
import { initiatePayout } from "@/lib/payouts";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  const secretBuf = Buffer.from(secret);
  const providedBuf = Buffer.from(provided);
  if (secretBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(secretBuf, providedBuf);
}

type PayoutRunResult =
  | { vendorId: string; status: "initiated"; reference: string }
  | { vendorId: string; status: "skipped"; reason: string }
  | { vendorId: string; status: "failed"; error: string };

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scheduledPayoutsEnabled } = await getSetting("payment_config");
  if (!scheduledPayoutsEnabled) {
    return NextResponse.json({ processed: 0, results: [], disabled: true });
  }

  const { minPayoutNaira } = await getSetting("pricing_config");
  const minPayoutKobo = nairaToKobo(minPayoutNaira);

  const vendors = await db.vendor_profile.findMany({
    where: {
      bank_code: { not: null },
      bank_name: { not: null },
      account_number: { not: null },
      account_name: { not: null },
    },
    select: {
      user_id: true,
      bank_code: true,
      bank_name: true,
      account_number: true,
      account_name: true,
    },
  });

  const results: PayoutRunResult[] = [];

  // Sequential on purpose — this hits Flutterwave's transfer API and takes
  // out an advisory lock per vendor; no reason to burst a batch of live
  // money-movement calls at once.
  for (const vendor of vendors) {
    const balance = await vendorBalance(vendor.user_id);
    if (balance < minPayoutKobo) {
      results.push({
        vendorId: vendor.user_id,
        status: "skipped",
        reason: "below minimum payout",
      });
      continue;
    }

    const result = await initiatePayout(vendor.user_id, balance, {
      bank_code: vendor.bank_code!,
      bank_name: vendor.bank_name!,
      account_number: vendor.account_number!,
      account_name: vendor.account_name!,
    });

    results.push(
      "error" in result
        ? { vendorId: vendor.user_id, status: "failed", error: result.error }
        : {
            vendorId: vendor.user_id,
            status: "initiated",
            reference: result.reference,
          },
    );
  }

  return NextResponse.json({ processed: results.length, results });
}
