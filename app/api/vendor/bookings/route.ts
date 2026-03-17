import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { BookingStatus } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isVendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "upcoming"; // "upcoming" | "past"
  const routeFilter = searchParams.get("route") ?? "all"; // route name or "all"
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const statusFilter: BookingStatus[] =
    tab === "upcoming"
      ? ["CONFIRMED", "PENDING"]
      : ["CANCELLED", "FAILED"];

  const dateRange: { gte?: Date; lte?: Date } = {};
  if (dateFrom) dateRange.gte = new Date(dateFrom);
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    dateRange.lte = to;
  }

  const [bookings, routeNames] = await Promise.all([
    db.booking.findMany({
      where: {
        vendorId: session.user.id,
        status: { in: statusFilter },
        ...(routeFilter !== "all" ? { routeName: routeFilter } : {}),
        ...(Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        passengerName: true,
        passengerPhone: true,
        routeName: true,
        direction: true,
        fare: true,
        status: true,
        createdAt: true,
      },
    }),
    db.booking.findMany({
      where: { vendorId: session.user.id },
      select: { routeName: true },
      distinct: ["routeName"],
      orderBy: { routeName: "asc" },
    }),
  ]);

  return NextResponse.json({
    bookings,
    routes: routeNames.map((r) => r.routeName),
  });
}
