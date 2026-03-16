"use server";

import { db } from "@/lib/db";

export async function initializeBooking({
  userId,
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
}: {
  userId: string | null;
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
}): Promise<{ reference: string } | { error: string }> {
  try {
    const reference = `CPTX-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    await db.booking.create({
      data: {
        reference,
        status: "PENDING",
        passengerName,
        passengerPhone,
        parentsPhone,
        hall,
        roomNumber,
        direction,
        routeName,
        fare,
        serviceFee,
        userId: userId ?? null,
        vendorId,
        routeId,
      },
    });

    return { reference };
  } catch {
    return { error: "Failed to initialise booking. Please try again." };
  }
}
