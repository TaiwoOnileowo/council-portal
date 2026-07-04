"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  priceListBodySchema,
  VENDOR_BOOKINGS_PAGE_SIZE,
} from "@/modules/transport/transport.types";
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
  departureTimes: { departsAt: string }[];
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
            where: { departs_at: { gte: new Date() } },
            select: { departs_at: true },
            orderBy: { departs_at: "asc" },
          },
        },
      },
    },
  });

  return rows
    .map((v) => ({
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
          departureTimes: pl.departure_times.map((d) => ({
            departsAt: d.departs_at.toISOString(),
          })),
        })),
    }))
    .filter((v) => v.priceLists.some((pl) => pl.routes.length > 0));
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
    departsAt: d.departs_at.toISOString(),
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
  const dateRange: { gte?: Date; lte?: Date } = {};
  if (filters.dateFrom) dateRange.gte = new Date(filters.dateFrom);
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    dateRange.lte = to;
  }

  const departureDateRange: { gte?: Date; lte?: Date } = {};
  if (filters.departureDateFrom)
    departureDateRange.gte = new Date(filters.departureDateFrom);
  if (filters.departureDateTo) {
    const to = new Date(filters.departureDateTo);
    to.setHours(23, 59, 59, 999);
    departureDateRange.lte = to;
  }

  const search = filters.search.trim();
  const searchWhere = search
    ? {
        OR: [
          {
            passenger_name: { contains: search, mode: "insensitive" as const },
          },
          { passenger_phone: { contains: search } },
          { reference: { contains: search, mode: "insensitive" as const } },
          { hall: { contains: search, mode: "insensitive" as const } },
          { room_number: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Facet base: every filter except route, so per-route counts stay meaningful.
  const baseWhere = {
    ...(filters.vendorId ? { vendor_id: filters.vendorId } : {}),
    status: "CONFIRMED" as BookingStatus,
    ...(Object.keys(dateRange).length > 0 ? { created_at: dateRange } : {}),
    ...(Object.keys(departureDateRange).length > 0
      ? { departure_at: departureDateRange }
      : {}),
    ...searchWhere,
  };

  const where = {
    ...baseWhere,
    ...(filters.route !== "all" ? { route_name: filters.route } : {}),
  };

  const page = Math.max(0, filters.page);

  const [bookings, routeCountRows, routeNames] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: page * VENDOR_BOOKINGS_PAGE_SIZE,
      take: VENDOR_BOOKINGS_PAGE_SIZE,
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
        commission: true,
        student_notes: true,
        vendor: { select: { business_name: true } },
        destination_address: true,
        departure_at: true,
        status: true,
        created_at: true,
      },
    }),
    db.booking.groupBy({
      by: ["route_name"],
      where: baseWhere,
      _count: { _all: true },
    }),
    db.booking.findMany({
      where: filters.vendorId ? { vendor_id: filters.vendorId } : {},
      select: { route_name: true },
      distinct: ["route_name"],
      orderBy: { route_name: "asc" },
    }),
  ]);

  const routeCounts: Record<string, number> = {};
  for (const row of routeCountRows)
    routeCounts[row.route_name] = row._count._all;

  const total =
    filters.route !== "all"
      ? (routeCounts[filters.route] ?? 0)
      : Object.values(routeCounts).reduce((sum, n) => sum + n, 0);

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
        vendorName: b.vendor.business_name,
        fare: b.fare,
        commission: b.commission,
        studentNotes: b.student_notes,
        destinationAddress: b.destination_address,
        departureAt: b.departure_at ? b.departure_at.toISOString() : null,
        createdAt: b.created_at.toISOString(),
        status: b.status as TransportBooking["status"],
        direction: b.direction as TransportBooking["direction"],
      })),
      routes: routeNames.map((r) => r.route_name),
      routeCounts,
      total,
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
    include: {
      routes: true,
      departure_times: { orderBy: { departs_at: "asc" } },
    },
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
        create: data.departureTimes.map((d) => ({
          departs_at: new Date(d.departsAt),
        })),
      },
    },
    include: {
      routes: true,
      departure_times: { orderBy: { departs_at: "asc" } },
    },
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
    // Reconcile routes by id so existing route IDs stay stable (bookings
    // reference them). Update in place, create new, and never hard-delete a
    // route that has bookings — deactivate it instead.
    const existingRoutes = await tx.price_list_route.findMany({
      where: { price_list_id: id },
      select: { id: true },
    });
    const existingIds = new Set(existingRoutes.map((r) => r.id));
    const incomingIds = new Set(
      data.routes
        .map((r) => r.id)
        .filter((rid): rid is string => !!rid && existingIds.has(rid)),
    );

    const removedIds = [...existingIds].filter((rid) => !incomingIds.has(rid));
    if (removedIds.length) {
      const booked = await tx.booking.findMany({
        where: { route_id: { in: removedIds } },
        select: { route_id: true },
        distinct: ["route_id"],
      });
      const bookedIds = new Set(booked.map((b) => b.route_id));
      const deletable = removedIds.filter((rid) => !bookedIds.has(rid));
      if (deletable.length)
        await tx.price_list_route.deleteMany({
          where: { id: { in: deletable } },
        });
      if (bookedIds.size)
        await tx.price_list_route.updateMany({
          where: { id: { in: [...bookedIds] } },
          data: { active: false },
        });
    }

    for (const r of data.routes) {
      if (r.id && existingIds.has(r.id)) {
        await tx.price_list_route.update({
          where: { id: r.id },
          data: {
            name: r.name,
            price: r.price,
            capacity: r.capacity,
            active: r.active,
          },
        });
      } else {
        await tx.price_list_route.create({
          data: {
            price_list_id: id,
            name: r.name,
            price: r.price,
            capacity: r.capacity,
            active: r.active,
          },
        });
      }
    }

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
        departure_times: {
          create: data.departureTimes.map((d) => ({
            departs_at: new Date(d.departsAt),
          })),
        },
      },
      include: {
        routes: true,
        departure_times: { orderBy: { departs_at: "asc" } },
      },
    });
  });

  return { ok: true, data: formatPriceList(updated) };
}

