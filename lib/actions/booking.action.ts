"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendBookingConfirmationEmail } from "@/lib/sendpulse";
import type { StudentBooking } from "@/modules/transport/transport.types";

export async function getBookings(): Promise<
  { ok: true; data: StudentBooking[] } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const bookings = await db.booking.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      reference: true,
      status: true,
      passengerName: true,
      passengerPhone: true,
      parentsPhone: true,
      hall: true,
      roomNumber: true,
      direction: true,
      routeName: true,
      fare: true,
      serviceFee: true,
      studentNotes: true,
      createdAt: true,
      vendor: {
        select: { transportName: true, phone: true, image: true },
      },
      route: {
        select: {
          priceList: {
            select: { luggagePolicy: true, notes: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    ok: true,
    data: bookings.map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      status: b.status as StudentBooking["status"],
      direction: b.direction as StudentBooking["direction"],
    })),
  };
}

export async function payBookingFromWallet({
  vendorId,
  routeId,
  direction,
  passengerName,
  passengerPhone,
  parentsPhone,
  hall,
  roomNumber,
  routeName,
  fare,
  serviceFee,
  studentNotes,
}: {
  vendorId: string;
  routeId: string;
  direction: "LEAVING" | "RETURNING";
  passengerName: string;
  passengerPhone: string;
  parentsPhone: string;
  hall: string;
  roomNumber: string;
  routeName: string;
  fare: number;
  serviceFee: number;
  studentNotes?: string;
}): Promise<
  | { reference: string }
  | { error: "INSUFFICIENT_BALANCE"; shortfall: number }
  | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in to book." };

  const userId = session.user.id;
  const totalAmountKobo = (fare + serviceFee) * 100;

  const reference = `BK${Math.random().toString().slice(2, 10).padEnd(8, "0")}`;

  try {
    const result = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      if (wallet.balance < totalAmountKobo) {
        return {
          error: "INSUFFICIENT_BALANCE" as const,
          shortfall: Math.ceil((totalAmountKobo - wallet.balance) / 100),
        };
      }

      const booking = await tx.booking.create({
        data: {
          reference,
          status: "CONFIRMED",
          passengerName,
          passengerPhone,
          parentsPhone,
          hall,
          roomNumber,
          direction,
          routeName,
          fare,
          serviceFee,
          studentNotes: studentNotes?.trim() || null,
          userId,
          vendorId,
          routeId,
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: "PAYMENT",
          status: "COMPLETED",
          amount: totalAmountKobo,
          description: `Transport booking — ${routeName}`,
          ref: reference,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: totalAmountKobo } },
      });

      return { reference: booking.reference };
    });

    if ("error" in result) return result;

    // Fire-and-forget confirmation email
    const [user, vendor] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      }),
      db.vendor.findUnique({
        where: { id: vendorId },
        select: { transportName: true },
      }),
    ]);

    if (user?.email && vendor) {
      const firstName = user.name.split(" ")[0];
      sendBookingConfirmationEmail(user.email, firstName, {
        reference,
        vendorName: vendor.transportName,
        routeName,
        direction,
        hall,
        roomNumber,
        totalAmount: fare + serviceFee,
      }).catch((err) => console.error("[booking-email]", err));
    }

    return { reference };
  } catch {
    return { error: "Failed to complete booking. Please try again." };
  }
}
