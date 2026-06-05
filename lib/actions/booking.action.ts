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
    where: { user_id: session.user.id },
    select: {
      id: true,
      reference: true,
      status: true,
      passenger_name: true,
      passenger_phone: true,
      parents_phone: true,
      hall: true,
      room_number: true,
      direction: true,
      route_name: true,
      fare: true,
      service_fee: true,
      student_notes: true,
      created_at: true,
      vendor: {
        select: {
          business_name: true,
          user: { select: { phone: true, image: true } },
        },
      },
      route: {
        select: {
          price_list: {
            select: { luggage_policy: true, notes: true },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return {
    ok: true,
    data: bookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      status: b.status as StudentBooking["status"],
      passengerName: b.passenger_name,
      passengerPhone: b.passenger_phone,
      parentsPhone: b.parents_phone,
      hall: b.hall,
      roomNumber: b.room_number,
      direction: b.direction as StudentBooking["direction"],
      routeName: b.route_name,
      fare: b.fare,
      serviceFee: b.service_fee,
      studentNotes: b.student_notes,
      createdAt: b.created_at.toISOString(),
      vendor: {
        transportName: b.vendor.business_name,
        phone: b.vendor.user.phone,
        image: b.vendor.user.image,
      },
      route: {
        priceList: {
          luggagePolicy: b.route.price_list.luggage_policy,
          notes: b.route.price_list.notes,
        },
      },
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
      const latest = await tx.wallet.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        select: { balance: true },
      });
      const currentBalance = latest?.balance ?? 0;

      if (currentBalance < totalAmountKobo) {
        return {
          error: "INSUFFICIENT_BALANCE" as const,
          shortfall: Math.ceil((totalAmountKobo - currentBalance) / 100),
        };
      }

      const booking = await tx.booking.create({
        data: {
          reference,
          status: "CONFIRMED",
          passenger_name: passengerName,
          passenger_phone: passengerPhone,
          parents_phone: parentsPhone,
          hall,
          room_number: roomNumber,
          direction,
          route_name: routeName,
          fare,
          service_fee: serviceFee,
          student_notes: studentNotes?.trim() || null,
          user_id: userId,
          vendor_id: vendorId,
          route_id: routeId,
        },
      });

      await tx.wallet.create({
        data: {
          user_id: userId,
          difference: -totalAmountKobo,
          balance: currentBalance - totalAmountKobo,
          reason: `Transport booking — ${routeName}`,
          type: "booking",
          model_responsible: "Booking",
          model_id: booking.id,
          reference,
        },
      });

      return { reference: booking.reference };
    });

    if ("error" in result) return result;

    // Fire-and-forget confirmation email
    const [user, vendor] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { email: true, first_name: true },
      }),
      db.vendor_profile.findUnique({
        where: { user_id: vendorId },
        select: { business_name: true },
      }),
    ]);

    if (user?.email && vendor) {
      sendBookingConfirmationEmail(user.email, user.first_name, {
        reference,
        vendorName: vendor.business_name,
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
