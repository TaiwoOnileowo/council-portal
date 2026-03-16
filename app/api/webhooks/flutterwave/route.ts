import { db } from "@/lib/db";
import { sendBookingConfirmationEmail } from "@/lib/sendpulse";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Verify Flutterwave secret hash
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
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

  // Only handle charge.completed
  if (event !== "charge.completed") {
    return NextResponse.json({ received: true });
  }

  const data = body.data as Record<string, unknown> | undefined;
  if (!data) return NextResponse.json({ received: true });

  const txRef = data.tx_ref as string | undefined;
  const flwRef = data.flw_ref as string | undefined;
  const status = data.status as string | undefined;
  const amount = data.amount as number | undefined;
  const currency = data.currency as string | undefined;

  if (!txRef) return NextResponse.json({ received: true });

  const booking = await db.booking.findUnique({
    where: { reference: txRef },
    include: {
      vendor: { select: { transportName: true } },
      user: { select: { email: true, name: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ received: true });
  }

  // Idempotency — already handled
  if (booking.status === "CONFIRMED") {
    return NextResponse.json({ received: true });
  }

  // Verify currency
  if (currency !== "NGN") {
    await db.booking.update({
      where: { id: booking.id },
      data: { status: "FAILED", flwRef: flwRef ?? null },
    });
    return NextResponse.json({ received: true });
  }

  // Verify amount matches (allow small tolerance for rounding)
  const expectedAmount = booking.fare + booking.serviceFee;
  if (
    status !== "successful" ||
    amount === undefined ||
    amount < expectedAmount - 1
  ) {
    await db.booking.update({
      where: { id: booking.id },
      data: { status: "FAILED", flwRef: flwRef ?? null },
    });
    return NextResponse.json({ received: true });
  }

  // Confirm the booking
  await db.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", flwRef: flwRef ?? null },
  });

  // Send confirmation email (fire and forget — don't fail webhook)
  if (booking.user?.email) {
    const firstName = booking.user.name.split(" ")[0];
    sendBookingConfirmationEmail(booking.user.email, firstName, {
      reference: booking.reference,
      vendorName: booking.vendor.transportName,
      routeName: booking.routeName,
      direction: booking.direction as "LEAVING" | "RETURNING",
      hall: booking.hall,
      roomNumber: booking.roomNumber,
      totalAmount: booking.fare + booking.serviceFee,
    }).catch((err) => console.error("[booking-email]", err));
  }

  return NextResponse.json({ received: true });
}
