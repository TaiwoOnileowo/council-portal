"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { priceListBodySchema } from "@/modules/transport/transport.types";
import type {
  PriceList,
  PriceListRoute,
  PriceListAvailability,
  DepartureTime,
  TransportBooking,
  TransportBookingsResponse,
  BookingsFilters,
} from "@/modules/transport/transport.types";
import type {
  price_list as DbPriceList,
  price_list_route as DbRoute,
  departure_time as DbDepartureTime,
  BookingStatus,
} from "@/generated/prisma/client";

export type PublicRoute = {
  id: string;
  name: string;
  price: number; // naira
  capacity: number | null;
};

export type PublicPriceList = {
  id: string;
  name: string;
  direction: "LEAVING" | "RETURNING";
  availType: "ACTIVE" | "INACTIVE" | "SCHEDULED";
  schedEnd: Date | null;
  schedStart: Date | null;
  luggagePolicy: string;
  notes: string;
  routes: PublicRoute[];
  departureTimes: { day: string; time: string }[];
};

export type PublicVendor = {
  id: string;
  transportName: string;
  image: string | null;
  tagline: string | null;
  description: string | null;
  instagram: string | null;
  tiktok: string | null;
  phone: string;
  isActive: boolean;
  priceLists: PublicPriceList[];
};

export async function getPublicTransports(): Promise<PublicVendor[]> {
  const rows = await db.vendor_profile.findMany({
    where: { is_active: true, category: "TRANSPORT" },
    select: {
      user_id: true,
      business_name: true,
      tagline: true,
      description: true,
      instagram: true,
      tiktok: true,
      is_active: true,
      user: { select: { image: true, phone: true } },
      price_lists: {
        select: {
          id: true,
          name: true,
          direction: true,
          availability_type: true,
          scheduled_end: true,
          scheduled_start: true,
          luggage_policy: true,
          notes: true,
          routes: {
            where: { active: true },
            select: { id: true, name: true, price: true, capacity: true },
          },
          departure_times: {
            select: { day: true, time: true },
          },
        },
      },
    },
  });

  return rows.map((v) => ({
    id: v.user_id,
    transportName: v.business_name,
    image: v.user.image,
    tagline: v.tagline,
    description: v.description,
    instagram: v.instagram,
    tiktok: v.tiktok,
    phone: v.user.phone ?? "",
    isActive: v.is_active,
    priceLists: v.price_lists
      .filter((pl) => String(pl.availability_type) !== "INACTIVE")
      .map((pl) => ({
        id: pl.id,
        name: pl.name,
        direction: String(pl.direction) as "LEAVING" | "RETURNING",
        availType: String(pl.availability_type) as
          | "ACTIVE"
          | "INACTIVE"
          | "SCHEDULED",
        schedEnd: pl.scheduled_end,
        schedStart: pl.scheduled_start,
        luggagePolicy: pl.luggage_policy,
        notes: pl.notes,
        routes: pl.routes.map((r) => ({
          id: r.id,
          name: r.name,
          price: r.price,
          capacity: r.capacity,
        })),
        departureTimes: pl.departure_times,
      })),
  }));
}

type DbPriceListFull = DbPriceList & {
  routes: DbRoute[];
  departure_times: DbDepartureTime[];
};

function formatPriceList(pl: DbPriceListFull): PriceList {
  const routes: PriceListRoute[] = pl.routes.map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    capacity: r.capacity === null ? "unlimited" : r.capacity,
    active: r.active,
  }));

  const departureTimes: DepartureTime[] = pl.departure_times.map((d) => ({
    id: d.id,
    day: d.day,
    time: d.time,
  }));

  let availability: PriceListAvailability;
  if (
    pl.availability_type === "SCHEDULED" &&
    pl.scheduled_start &&
    pl.scheduled_end
  ) {
    availability = {
      type: "scheduled",
      startDate: pl.scheduled_start.toISOString().split("T")[0],
      endDate: pl.scheduled_end.toISOString().split("T")[0],
    };
  } else if (pl.availability_type === "INACTIVE") {
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
    luggagePolicy: pl.luggage_policy,
    notes: pl.notes,
    availability,
  };
}

export async function getTransportBookings(
  filters: BookingsFilters,
): Promise<
  { ok: true; data: TransportBookingsResponse } | { ok: false; error: string }
> {
  const session = await auth();
  if (session?.user?.role !== "VENDOR")
    return { ok: false, error: "Unauthorized" };

  const statusFilter: BookingStatus[] =
    filters.tab === "upcoming" ? ["CONFIRMED"] : ["CANCELLED", "FAILED"];

  const dateRange: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) dateRange.gte = new Date(filters.dateFrom);
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    dateRange.lte = to;
  }

  const [bookings, routeNames] = await Promise.all([
    db.booking.findMany({
      where: {
        vendor_id: session.user.id,
        status: { in: statusFilter },
        ...(filters.route !== "all" ? { route_name: filters.route } : {}),
        ...(Object.keys(dateRange).length > 0 ? { created_at: dateRange } : {}),
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        reference: true,
        passenger_name: true,
        passenger_phone: true,
        parents_phone: true,
        hall: true,
        room_number: true,
        route_name: true,
        direction: true,
        fare: true,
        student_notes: true,
        status: true,
        created_at: true,
      },
    }),
    db.booking.findMany({
      where: { vendor_id: session.user.id },
      select: { route_name: true },
      distinct: ["route_name"],
      orderBy: { route_name: "asc" },
    }),
  ]);

  return {
    ok: true,
    data: {
      bookings: bookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        passengerName: b.passenger_name,
        passengerPhone: b.passenger_phone,
        parentsPhone: b.parents_phone,
        hall: b.hall,
        roomNumber: b.room_number,
        routeName: b.route_name,
        fare: b.fare,
        studentNotes: b.student_notes,
        createdAt: b.created_at.toISOString(),
        status: b.status as TransportBooking["status"],
        direction: b.direction as TransportBooking["direction"],
      })),
      routes: routeNames.map((r) => r.route_name),
    },
  };
}

export async function getTransportPriceLists(): Promise<
  { ok: true; data: PriceList[] } | { ok: false; error: string }
> {
  const session = await auth();
  if (session?.user?.role !== "VENDOR")
    return { ok: false, error: "Unauthorized" };

  const rows = await db.price_list.findMany({
    where: { vendor_id: session.user.id },
    include: { routes: true, departure_times: true },
    orderBy: { created_at: "desc" },
  });

  return { ok: true, data: rows.map(formatPriceList) };
}

export async function createPriceList(
  body: unknown,
): Promise<{ ok: true; data: PriceList } | { ok: false; error: string }> {
  const session = await auth();
  if (session?.user?.role !== "VENDOR")
    return { ok: false, error: "Unauthorized" };

  const parsed = priceListBodySchema.safeParse(body);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

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

  const existing = await db.price_list.findUnique({
    where: {
      vendor_id_direction: {
        vendor_id: session.user.id,
        direction: data.direction === "leaving" ? "LEAVING" : "RETURNING",
      },
    },
  });
  if (existing) {
    return {
      ok: false,
      error: "A price list for this direction already exists",
    };
  }

  const created = await db.price_list.create({
    data: {
      vendor_id: session.user.id,
      name: data.name,
      direction: data.direction === "leaving" ? "LEAVING" : "RETURNING",
      luggage_policy: data.luggagePolicy ?? "",
      notes: data.notes ?? "",
      availability_type: availType as "ACTIVE" | "INACTIVE" | "SCHEDULED",
      scheduled_start: schedStart,
      scheduled_end: schedEnd,
      routes: {
        create: data.routes.map((r) => ({
          name: r.name,
          price: r.price,
          capacity: r.capacity,
          active: r.active,
        })),
      },
      departure_times: {
        create: data.departureTimes.map((d) => ({ day: d.day, time: d.time })),
      },
    },
    include: { routes: true, departure_times: true },
  });

  return { ok: true, data: formatPriceList(created) };
}

export async function updatePriceList(
  id: string,
  body: unknown,
): Promise<{ ok: true; data: PriceList } | { ok: false; error: string }> {
  const session = await auth();
  if (session?.user?.role !== "VENDOR")
    return { ok: false, error: "Unauthorized" };

  const existing = await db.price_list.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Price list not found" };
  if (existing.vendor_id !== session.user.id)
    return { ok: false, error: "Forbidden" };

  const parsed = priceListBodySchema.safeParse(body);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

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
    await tx.price_list_route.deleteMany({ where: { price_list_id: id } });
    await tx.departure_time.deleteMany({ where: { price_list_id: id } });
    return tx.price_list.update({
      where: { id },
      data: {
        name: data.name,
        direction: data.direction === "leaving" ? "LEAVING" : "RETURNING",
        luggage_policy: data.luggagePolicy ?? "",
        notes: data.notes ?? "",
        availability_type: availType as "ACTIVE" | "INACTIVE" | "SCHEDULED",
        scheduled_start: schedStart,
        scheduled_end: schedEnd,
        routes: {
          create: data.routes.map((r) => ({
            name: r.name,
            price: r.price,
            capacity: r.capacity,
            active: r.active,
          })),
        },
        departure_times: {
          create: data.departureTimes.map((d) => ({
            day: d.day,
            time: d.time,
          })),
        },
      },
      include: { routes: true, departure_times: true },
    });
  });

  return { ok: true, data: formatPriceList(updated) };
}
