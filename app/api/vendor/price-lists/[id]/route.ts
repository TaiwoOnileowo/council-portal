import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { priceListBodySchema } from "@/lib/validations/vendor";
import type { PriceList, PriceListRoute, PriceListAvailability, DepartureTime } from "@/components/portal/vendor-dashboard/vendorDashboardData";
import type { PriceList as DbPriceList, PriceListRoute as DbRoute, DepartureTime as DbDepartureTime } from "@/generated/prisma/client";

type DbPriceListFull = DbPriceList & {
  routes: DbRoute[];
  departureTimes: DbDepartureTime[];
};

function mapToFrontend(pl: DbPriceListFull): PriceList {
  const routes: PriceListRoute[] = pl.routes.map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    capacity: r.capacity === null ? "unlimited" : r.capacity,
    active: r.active,
  }));

  const departureTimes: DepartureTime[] = pl.departureTimes.map((d) => ({
    id: d.id,
    day: d.day,
    time: d.time,
  }));

  let availability: PriceListAvailability;
  if (pl.availType === "SCHEDULED" && pl.schedStart && pl.schedEnd) {
    availability = {
      type: "scheduled",
      startDate: pl.schedStart.toISOString().split("T")[0],
      endDate: pl.schedEnd.toISOString().split("T")[0],
    };
  } else if (pl.availType === "INACTIVE") {
    availability = { type: "inactive" };
  } else {
    availability = { type: "active" };
  }

  return {
    id: pl.id,
    name: pl.name,
    direction: pl.direction === "LEAVING" ? "leaving" : "returning",
    routes,
    departureTimes,
    luggagePolicy: pl.luggagePolicy,
    notes: pl.notes,
    availability,
  };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.isVendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await db.priceList.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Price list not found" }, { status: 404 });
  }
  if (existing.vendorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = priceListBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;

  const availType =
    data.availability.type === "active"
      ? "ACTIVE"
      : data.availability.type === "inactive"
        ? "INACTIVE"
        : "SCHEDULED";

  const schedStart =
    data.availability.type === "scheduled"
      ? new Date(data.availability.startDate)
      : null;
  const schedEnd =
    data.availability.type === "scheduled"
      ? new Date(data.availability.endDate)
      : null;

  const updated = await db.$transaction(async (tx) => {
    await tx.priceListRoute.deleteMany({ where: { priceListId: id } });
    await tx.departureTime.deleteMany({ where: { priceListId: id } });

    return tx.priceList.update({
      where: { id },
      data: {
        name: data.name,
        direction: data.direction === "leaving" ? "LEAVING" : "RETURNING",
        luggagePolicy: data.luggagePolicy ?? "",
        notes: data.notes ?? "",
        availType: availType as "ACTIVE" | "INACTIVE" | "SCHEDULED",
        schedStart,
        schedEnd,
        routes: {
          create: data.routes.map((r) => ({
            name: r.name,
            price: r.price,
            capacity: r.capacity,
            active: r.active,
          })),
        },
        departureTimes: {
          create: data.departureTimes.map((d) => ({
            day: d.day,
            time: d.time,
          })),
        },
      },
      include: { routes: true, departureTimes: true },
    });
  });

  return NextResponse.json({ priceList: mapToFrontend(updated) });
}
