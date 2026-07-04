import { db } from "@/lib/db";
import { markPayoutSuccess, reversePayout } from "@/lib/payouts";
import { creditWallet } from "@/lib/actions/wallet.action";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Verify Flutterwave secret hash
  const secretHash = process.env.FLW_ENCRYPTION_KEY;
  const signature = req.headers.get("verif-hash");

  if (!secretHash || signature !== secretHash) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as string | undefined;
  const data = body.data as Record<string, unknown> | undefined;
  if (!data) return NextResponse.json({ received: true });

  if (event === "transfer.completed") {
    const reference = data.reference as string | undefined;
    const status = data.status as string | undefined;
    if (!reference) return NextResponse.json({ received: true });

    if (status === "SUCCESSFUL") {
      await markPayoutSuccess(reference);
    } else if (status === "FAILED") {
      await reversePayout(
        reference,
        (data.complete_message as string | undefined) ?? "Transfer failed.",
      );
    }
    return NextResponse.json({ received: true });
  }

  if (event !== "charge.completed") {
    return NextResponse.json({ received: true });
  }

  const txRef = data.tx_ref as string | undefined;
  const status = data.status as string | undefined;
  const amount = data.amount as number | undefined;
  const currency = data.currency as string | undefined;

  if (!txRef || status !== "successful" || currency !== "NGN" || !amount) {
    return NextResponse.json({ received: true });
  }

  const amountKobo = Math.round(amount * 100);

  // Static virtual account credit — Flutterwave echoes back the tx_ref we
  // supplied when the account was created, not a per-transfer one, so we
  // look up the owner by that instead of by meta.userId.
  if (txRef.startsWith("VA-")) {
    const virtualAccount = await db.virtual_account.findUnique({
      where: { tx_ref: txRef },
    });
    if (!virtualAccount) {
      console.error(
        "[flutterwave webhook] unattributed virtual account transfer",
        {
          txRef,
          flwRef: data.flw_ref,
          amount,
        },
      );
      return NextResponse.json({ received: true });
    }

    const flwRef =
      (data.flw_ref as string | undefined) || String(data.id ?? "");
    if (!flwRef) return NextResponse.json({ received: true });

    const owner = virtualAccount.vendor_id
      ? { vendorId: virtualAccount.vendor_id }
      : { userId: virtualAccount.user_id! };

    await creditWallet(owner, {
      amountKobo,
      reason: "Wallet top-up — bank transfer",
      type: "topup",
      modelResponsible: "VirtualAccount",
      reference: flwRef,
    });

    return NextResponse.json({ received: true });
  }

  if (!txRef.startsWith("TOPUP-")) {
    return NextResponse.json({ received: true });
  }

  const meta = data.meta as Record<string, unknown> | undefined;
  const userId = meta?.userId as string | undefined;
  if (!userId) return NextResponse.json({ received: true });

  await creditWallet(
    { userId },
    {
      amountKobo,
      reason: "Wallet top-up",
      type: "topup",
      modelResponsible: "Payment",
      reference: txRef,
    },
  );

  return NextResponse.json({ received: true });
}
