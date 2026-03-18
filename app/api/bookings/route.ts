import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        select: {
          transportName: true,
          phone: true,
          image: true,
        },
      },
      route: {
        select: {
          priceList: {
            select: {
              luggagePolicy: true,
              notes: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
