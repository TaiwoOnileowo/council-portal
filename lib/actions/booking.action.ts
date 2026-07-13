"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  sendBookingConfirmationEmail,
  sendNewBookingVendorEmail,
} from "@/lib/sendpulse";
import {
  bookingCheckoutMetadataSchema,
  STUDENT_BOOKINGS_PAGE_SIZE,
  type BookingCheckoutMetadata,
  type StudentBooking,
  type StudentBookingsFilters,
  type StudentBookingsResponse,
} from "@/modules/transport/transport.types";
import type { Prisma } from "@/generated/prisma/client";
import { nairaToKobo, computeServiceFee } from "@/lib/money";
import { vendorBalance } from "@/lib/actions/wallet.action";
import { getSetting } from "@/lib/settings";
import { isWalletEnabled } from "@/lib/payment-config";
import { logger } from "@/lib/logger";
import { startPayment, getPaymentByReference } from "@/lib/payments";
import { RouteFullyBookedError } from "@/lib/booking-errors";

async function isDepartureFull({
  client,
  routeId,
  departureAt,
}: {
  client: Prisma.TransactionClient | typeof db;
  routeId: string;
  departureAt: string;
}): Promise<boolean> {
  const departsAt = new Date(departureAt);

  const departure = await client.departure_time.findFirst({
    where: { route_id: routeId, departs_at: departsAt },
    select: { capacity: true },
  });
  if (!departure || departure.capacity === null) return false;

  const confirmedCount = await client.booking.count({
    where: { route_id: routeId, departure_at: departsAt, status: "CONFIRMED" },
  });
  return confirmedCount >= departure.capacity;
}

async function assertDepartureHasCapacity({
  tx,
  routeId,
  departureAt,
}: {
  tx: Prisma.TransactionClient;
  routeId: string;
  departureAt: string | null | undefined;
}): Promise<void> {
  if (!departureAt) return;

  // Locks on (route, timestamp) together so two students booking the last
  // seat on the same departure serialize on this check instead of both
  // slipping through; a different departure on the same route isn't
  // blocked by this at all.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${routeId + "|" + departureAt}))`;

  if (await isDepartureFull({ client: tx, routeId, departureAt })) {
    throw new RouteFullyBookedError();
  }
}

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
  stop_name: true,
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
    stopName: b.stop_name,
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
  studentNotes,
  destinationAddress,
  stopName,
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
  studentNotes?: string;
  destinationAddress: string;
  stopName?: string | null;
  departureAt?: string;
}): Promise<
  | { reference: string }
  | { error: "INSUFFICIENT_BALANCE"; shortfall: number }
  | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in to book." };

  const { commissionNaira } = await getSetting("pricing_config");

  const serviceFee = 0;
  const userId = session.user.id;
  const totalAmountKobo = nairaToKobo(fare);
  const vendorEarningKobo = nairaToKobo(fare) - nairaToKobo(commissionNaira);

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

      await assertDepartureHasCapacity({ tx, routeId, departureAt });

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
          commission: commissionNaira,
          student_notes: studentNotes?.trim() || null,
          destination_address: destinationAddress.trim(),
          stop_name: stopName?.trim() || null,
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

    // Fire-and-forget confirmation emails
    const [user, vendor] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { email: true, first_name: true },
      }),
      db.vendor_profile.findUnique({
        where: { user_id: vendorId },
        select: {
          business_name: true,
          user: { select: { email: true, first_name: true } },
        },
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
      }).catch((err) =>
        logger.error("[booking]", "booking confirmation email failed", {
          reference,
          err,
        }),
      );
    }

    if (vendor?.user.email) {
      sendNewBookingVendorEmail(vendor.user.email, vendor.user.first_name, {
        reference,
        passengerName,
        passengerPhone,
        routeName,
        direction,
        hall,
        roomNumber,
        departureAt: departureAt ?? null,
        totalAmount: fare + serviceFee,
      }).catch((err) =>
        logger.error(
          "[booking]",
          "vendor new-booking notification email failed",
          { reference, err },
        ),
      );
    }

    return { reference };
  } catch (err) {
    if (err instanceof RouteFullyBookedError) {
      return {
        error:
          "This route is fully booked. Please choose another route or time.",
      };
    }
    logger.error("[booking]", "payBookingFromWallet transaction failed", {
      reference,
      userId,
      vendorId,
      totalAmountKobo,
      err,
    });
    return { error: "Failed to complete booking. Please try again." };
  }
}

export async function startBookingCheckout({
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
  studentNotes,
  destinationAddress,
  stopName,
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
  studentNotes?: string;
  destinationAddress: string;
  stopName?: string | null;
  departureAt?: string;
}): Promise<
  { authorizationUrl: string; reference: string } | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in to book." };

  if (
    departureAt &&
    (await isDepartureFull({ client: db, routeId, departureAt }))
  ) {
    return {
      error: "This route is fully booked. Please choose another route or time.",
    };
  }

  const [{ activeProcessor }, pricingConfig, user] = await Promise.all([
    getSetting("payment_config"),
    getSetting("pricing_config"),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, first_name: true, last_name: true },
    }),
  ]);
  if (!user) return { error: "User not found." };

  const { serviceFeeRate, serviceFeeCapNaira, commissionNaira } = pricingConfig;
  const serviceFee = computeServiceFee(
    fare,
    serviceFeeRate,
    serviceFeeCapNaira,
  );

  // Split payments settle the vendor's cut directly at the processor —
  // requires a subaccount for whichever processor is active. This is the
  // only way checkout-driven earnings can ever be paid out while wallet
  // (and so the whole payout system) is disabled, so it's derived from
  // that rather than an independent setting — the two can't drift apart
  // into the "wallet off, split off" state that would silently accumulate
  // vendor earnings nothing can ever pay out. When wallet IS enabled, this
  // falls back to the pre-split behavior: charge the full amount to us,
  // credit the vendor's wallet on success (see finalizeBookingCheckout).
  let split:
    | {
        subaccountId: string;
        vendorPayoutKobo: number;
        platformFeeKobo: number;
      }
    | undefined;
  if (!(await isWalletEnabled())) {
    const vendorAccount = await db.vendor_profile.findUnique({
      where: { user_id: vendorId },
      select: {
        paystack_subaccount_code: true,
        flutterwave_subaccount_id: true,
      },
    });

    const subaccountId =
      activeProcessor === "paystack"
        ? vendorAccount?.paystack_subaccount_code
        : vendorAccount?.flutterwave_subaccount_id;

    if (!subaccountId) {
      logger.warn(
        "[booking-checkout]",
        "checkout blocked: vendor has no subaccount",
        {
          vendorId,
          activeProcessor,
        },
      );
      return {
        error:
          "This vendor hasn't finished payment setup yet. Please try another vendor or check back later.",
      };
    }

    split = {
      subaccountId,
      vendorPayoutKobo: nairaToKobo(fare) - nairaToKobo(commissionNaira),
      platformFeeKobo: nairaToKobo(commissionNaira + serviceFee),
    };
  }

  const reference = `BK${Math.random().toString().slice(2, 10).padEnd(8, "0")}`;

  return startPayment({
    reference,
    amountKobo: nairaToKobo(fare + serviceFee),
    userId: session.user.id,
    destination: "booking",
    email: user.email,
    name: `${user.first_name} ${user.last_name}`,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/transport?booking_ref=${reference}`,
    split,
    metadata: {
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
      commissionNaira,
      studentNotes: studentNotes?.trim() || null,
      destinationAddress: destinationAddress.trim(),
      stopName: stopName?.trim() || null,
      departureAt: departureAt ?? null,
      splitPayment: !!split,
    },
  });
}

// Runs inside the caller's payment-success transaction (see
// completePaymentSuccess) — throwing here rolls back the whole transaction,
// including the payment's SUCCESS transition, so a bad write leaves the
// payment PENDING for a retry instead of stuck SUCCESS with no booking.
//
// `m.splitPayment` reflects what actually happened at charge time (recorded
// once in metadata by startBookingCheckout), not the live payment_config
// setting — payment_config.splitPaymentsEnabled could be toggled any time
// between checkout and this webhook firing, and deciding based on the live
// value here would risk crediting a wallet for money that already settled
// straight to the vendor via a processor split (or the reverse).
export async function finalizeBookingCheckout(
  payment: { reference: string; user_id: string; metadata: Prisma.JsonValue },
  tx: Prisma.TransactionClient,
): Promise<BookingCheckoutMetadata> {
  const parsed = bookingCheckoutMetadataSchema.safeParse(payment.metadata);
  if (!parsed.success) {
    throw new Error(
      `invalid booking checkout metadata for ${payment.reference}: ${parsed.error.message}`,
    );
  }
  const m = parsed.data;

  await assertDepartureHasCapacity({ tx, routeId: m.routeId, departureAt: m.departureAt });

  const booking = await tx.booking.create({
    data: {
      reference: payment.reference,
      status: "CONFIRMED",
      passenger_name: m.passengerName,
      passenger_phone: m.passengerPhone,
      parents_phone: m.parentsPhone,
      hall: m.hall,
      room_number: m.roomNumber,
      direction: m.direction,
      route_name: m.routeName,
      fare: m.fare,
      service_fee: m.serviceFee,
      commission: m.commissionNaira,
      student_notes: m.studentNotes,
      destination_address: m.destinationAddress,
      stop_name: m.stopName,
      departure_at: m.departureAt ? new Date(m.departureAt) : null,
      user_id: payment.user_id,
      vendor_id: m.vendorId,
      route_id: m.routeId,
    },
  });

  if (m.splitPayment) {
    // The charge already split at the processor — the vendor's cut settled
    // straight to their own bank account and never touched our balance.
    // Crediting an internal "earning" entry for money we never actually
    // held would be a phantom balance with nothing behind it to pay out.
    // The booking row above is the lasting record of what was earned.
  } else {
    // Pre-split behavior: we hold the full charge, so credit the vendor's
    // wallet same as payBookingFromWallet — that balance gets paid out
    // later via withdrawal or the scheduled payout cron.
    const vendorEarningKobo =
      nairaToKobo(m.fare) - nairaToKobo(m.commissionNaira);

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${m.vendorId}))`;

    const vBal = await vendorBalance(m.vendorId, tx);

    await tx.wallet.create({
      data: {
        vendor_id: m.vendorId,
        difference: vendorEarningKobo,
        balance: vBal + vendorEarningKobo,
        reason: `Earning — ${m.routeName} · ${payment.reference}`,
        type: "earning",
        model_responsible: "Booking",
        model_id: booking.id,
        reference: `${payment.reference}-V`,
      },
    });
  }

  await tx.payment.updateMany({
    where: { reference: payment.reference },
    data: { destination_id: booking.id },
  });

  return m;
}

// Best-effort — called after the finalize transaction has committed, so a
// failed email never rolls back a successful booking.
export async function notifyBookingConfirmed(
  userId: string,
  reference: string,
  m: BookingCheckoutMetadata,
): Promise<void> {
  const [user, vendor] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { email: true, first_name: true },
    }),
    db.vendor_profile.findUnique({
      where: { user_id: m.vendorId },
      select: {
        business_name: true,
        user: { select: { email: true, first_name: true } },
      },
    }),
  ]);

  if (user?.email && vendor) {
    await sendBookingConfirmationEmail(user.email, user.first_name, {
      reference,
      vendorName: vendor.business_name,
      routeName: m.routeName,
      direction: m.direction,
      hall: m.hall,
      roomNumber: m.roomNumber,
      totalAmount: m.fare + m.serviceFee,
    });
  }

  if (vendor?.user.email) {
    await sendNewBookingVendorEmail(vendor.user.email, vendor.user.first_name, {
      reference,
      passengerName: m.passengerName,
      passengerPhone: m.passengerPhone,
      routeName: m.routeName,
      direction: m.direction,
      hall: m.hall,
      roomNumber: m.roomNumber,
      departureAt: m.departureAt,
      totalAmount: m.fare + m.serviceFee,
    });
  }
}

export type BookingCheckoutStatus =
  | { status: "SUCCESS" | "PENDING" | "FAILED" }
  | { error: string };

export async function checkBookingCheckoutStatus(
  reference: string,
): Promise<BookingCheckoutStatus> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const payment = await getPaymentByReference(reference);
  if (!payment || payment.user_id !== session.user.id) {
    return { error: "Payment not found." };
  }

  return { status: payment.status };
}
