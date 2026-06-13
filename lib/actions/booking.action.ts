"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendBookingConfirmationEmail } from "@/lib/sendpulse";
import {
  STUDENT_BOOKINGS_PAGE_SIZE,
  type StudentBooking,
  type StudentBookingsFilters,
  type StudentBookingsResponse,
} from "@/modules/transport/transport.types";
import type { Prisma } from "@/generated/prisma/client";
import { COMMISSION_KOBO, COMMISSION_NAIRA, nairaToKobo } from "@/lib/money";
import { vendorBalance } from "@/lib/actions/wallet.action";

const studentBookingSelect = {
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
  destination_address: true,
  departure_at: true,
  created_at: true,
  vendor: {
    select: {
      business_name: true,
      user: { select: { phone: true, image: true } },
    },
  },
  route: {
    select: {
      price_list: { select: { luggage_policy: true, notes: true } },
    },
  },
} satisfies Prisma.bookingSelect;

type StudentBookingRow = Prisma.bookingGetPayload<{
  select: typeof studentBookingSelect;
}>;

function toStudentBooking(b: StudentBookingRow): StudentBooking {
  return {
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
    destinationAddress: b.destination_address,
    departureAt: b.departure_at ? b.departure_at.toISOString() : null,
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
  };
}

export async function getBookings(
  filters: StudentBookingsFilters = { vendorId: "all", search: "", page: 0 },
): Promise<
  { ok: true; data: StudentBookingsResponse } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const search = filters.search.trim();
  const searchWhere = search
    ? {
        OR: [
          { route_name: { contains: search, mode: "insensitive" as const } },
          { reference: { contains: search, mode: "insensitive" as const } },
          {
            passenger_name: { contains: search, mode: "insensitive" as const },
          },
          { hall: { contains: search, mode: "insensitive" as const } },
          { room_number: { contains: search, mode: "insensitive" as const } },
          {
            vendor: {
              business_name: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }
    : {};

  const where = {
    user_id: session.user.id,
    ...(filters.vendorId !== "all" ? { vendor_id: filters.vendorId } : {}),
    ...searchWhere,
  };

  const safePage = Math.max(0, filters.page);

  const [bookings, total, vendorRows] = await Promise.all([
    db.booking.findMany({
      where,
      skip: safePage * STUDENT_BOOKINGS_PAGE_SIZE,
      take: STUDENT_BOOKINGS_PAGE_SIZE,
      select: studentBookingSelect,
      orderBy: { created_at: "desc" },
    }),
    db.booking.count({ where }),
    db.booking.findMany({
      where: { user_id: session.user.id },
      select: { vendor_id: true, vendor: { select: { business_name: true } } },
      distinct: ["vendor_id"],
    }),
  ]);

  const vendors = vendorRows
    .map((v) => ({ id: v.vendor_id, name: v.vendor.business_name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    ok: true,
    data: {
      total,
      vendors,
      bookings: bookings.map(toStudentBooking),
    },
  };
}

export async function getNextBooking(): Promise<
  { ok: true; data: StudentBooking | null } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const booking = await db.booking.findFirst({
    where: {
      user_id: session.user.id,
      status: "CONFIRMED",
      departure_at: { gte: new Date() },
    },
    orderBy: { departure_at: "asc" },
    select: studentBookingSelect,
  });

  return { ok: true, data: booking ? toStudentBooking(booking) : null };
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
  destinationAddress,
  departureAt,
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
  destinationAddress: string;
  departureAt?: string;
}): Promise<
  | { reference: string }
  | { error: "INSUFFICIENT_BALANCE"; shortfall: number }
  | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in to book." };

  const userId = session.user.id;
  const totalAmountKobo = nairaToKobo(fare + serviceFee);
  const vendorEarningKobo = nairaToKobo(fare) - COMMISSION_KOBO;

  const reference = `BK${Math.random().toString().slice(2, 10).padEnd(8, "0")}`;

  // Lock both wallets in a deterministic order to serialize concurrent writes
  // to the same running balance without risking a deadlock.
  const lockKeys = [userId, vendorId].sort();

  try {
    const result = await db.$transaction(async (tx) => {
      for (const key of lockKeys) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
      }

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
          commission: COMMISSION_NAIRA,
          student_notes: studentNotes?.trim() || null,
          destination_address: destinationAddress.trim(),
          departure_at: departureAt ? new Date(departureAt) : null,
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

      const vBal = await vendorBalance(vendorId, tx);

      await tx.wallet.create({
        data: {
          vendor_id: vendorId,
          difference: vendorEarningKobo,
          balance: vBal + vendorEarningKobo,
          reason: `Earning — ${routeName} · ${reference}`,
          type: "earning",
          model_responsible: "Booking",
          model_id: booking.id,
          reference: `${reference}-V`,
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
