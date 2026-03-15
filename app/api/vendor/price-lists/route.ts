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

export async function GET() {
  const session = await auth();
  if (!session?.user?.isVendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.priceList.findMany({
    where: { vendorId: session.user.id },
    include: { routes: true, departureTimes: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ priceLists: rows.map(mapToFrontend) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isVendor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Enforce one price list per direction per vendor
  const existing = await db.priceList.findUnique({
    where: {
      vendorId_direction: {
        vendorId: session.user.id,
        direction: data.direction === "leaving" ? "LEAVING" : "RETURNING",
      },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A price list for this direction already exists" },
      { status: 409 },
    );
  }

  const created = await db.priceList.create({
    data: {
      vendorId: session.user.id,
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

  return NextResponse.json({ priceList: mapToFrontend(created) }, { status: 201 });
}
