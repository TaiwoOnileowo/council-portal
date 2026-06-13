export const runtime = "nodejs";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BookingReportDocument } from "@/modules/transport/components/BookingReportDocument";
import type { ExportFilters } from "@/modules/transport/transport.types";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { format } from "date-fns";
import path from "path";
import React from "react";

const logoPath = path.join(process.cwd(), "public", "logo.png");

function buildWhere(vendorId: string, filters: ExportFilters) {
  const bookingRange: { gte?: Date; lte?: Date } = {};
  if (filters.bookingDateFrom)
    bookingRange.gte = new Date(filters.bookingDateFrom);
  if (filters.bookingDateTo) {
    const to = new Date(filters.bookingDateTo);
    to.setHours(23, 59, 59, 999);
    bookingRange.lte = to;
  }

  const departureRange: { gte?: Date; lte?: Date } = {};
  if (filters.departureDateFrom)
    departureRange.gte = new Date(filters.departureDateFrom);
  if (filters.departureDateTo) {
    const to = new Date(filters.departureDateTo);
    to.setHours(23, 59, 59, 999);
    departureRange.lte = to;
  }

  return {
    vendor_id: vendorId,
    status: "CONFIRMED" as const,
    ...(filters.direction !== "all" ? { direction: filters.direction } : {}),
    ...(filters.route !== "all" ? { route_name: filters.route } : {}),
    ...(Object.keys(bookingRange).length > 0
      ? { created_at: bookingRange }
      : {}),
    ...(Object.keys(departureRange).length > 0
      ? { departure_at: departureRange }
      : {}),
  };
}

async function fetchBookings(vendorId: string, filters: ExportFilters) {
  return db.booking.findMany({
    where: buildWhere(vendorId, filters),
    orderBy: [
      { departure_at: { sort: "asc", nulls: "last" } },
      { created_at: "desc" },
    ],
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
      destination_address: true,
      departure_at: true,
      created_at: true,
    },
  });
}

function generateCSV(
  bookings: Awaited<ReturnType<typeof fetchBookings>>,
): string {
  const headers = [
    "Reference",
    "Passenger Name",
    "Phone",
    "Guardian Phone",
    "Route",
    "Direction",
    "Destination / Pickup Address",
    "Departure",
    "Booked On",
    "Hall",
    "Room",
    "Fare (NGN)",
    "Commission (NGN)",
    "Net (NGN)",
  ];

  const escape = (v: string | null | undefined) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;

  const rows = bookings.map((b) => [
    escape(b.reference),
    escape(b.passenger_name),
    escape(b.passenger_phone),
    escape(b.parents_phone),
    escape(b.route_name),
    b.direction === "LEAVING" ? "Leaving" : "Returning",
    escape(b.destination_address),
    b.departure_at ? format(b.departure_at, "d MMM yyyy, h:mm a") : "",
    format(b.created_at, "d MMM yyyy"),
    escape(b.hall),
    escape(b.room_number),
    String(b.fare),
    String(b.commission),
    String(b.fare - b.commission),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "VENDOR")
    return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);

  const filters: ExportFilters = {
    direction: (searchParams.get("direction") ??
      "all") as ExportFilters["direction"],
    route: searchParams.get("route") ?? "all",
    bookingDateFrom: searchParams.get("bookingDateFrom") ?? "",
    bookingDateTo: searchParams.get("bookingDateTo") ?? "",
    departureDateFrom: searchParams.get("departureDateFrom") ?? "",
    departureDateTo: searchParams.get("departureDateTo") ?? "",
  };

  const formatParam = searchParams.get("format") ?? "pdf";

  const [bookings, vendor] = await Promise.all([
    fetchBookings(session.user.id, filters),
    db.vendor_profile.findUnique({
      where: { user_id: session.user.id },
      select: { business_name: true },
    }),
  ]);

  const businessName = vendor?.business_name ?? "Vendor";
  const datestamp = format(new Date(), "yyyy-MM-dd");

  if (formatParam === "csv") {
    return new Response(generateCSV(bookings), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings-${datestamp}.csv"`,
      },
    });
  }

  const pdfBuffer = await renderToBuffer(
    React.createElement(BookingReportDocument, {
      businessName,
      logoPath,
      bookings: bookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        passengerName: b.passenger_name,
        passengerPhone: b.passenger_phone,
        parentsPhone: b.parents_phone,
        hall: b.hall,
        roomNumber: b.room_number,
        routeName: b.route_name,
        direction: b.direction as "LEAVING" | "RETURNING",
        fare: b.fare,
        commission: b.commission,
        destinationAddress: b.destination_address,
        departureAt: b.departure_at ? b.departure_at.toISOString() : null,
        createdAt: b.created_at.toISOString(),
      })),
      filters,
      generatedAt: new Date().toISOString(),
    }) as React.ReactElement<DocumentProps>,
  );

  const arrayBuffer = new ArrayBuffer(pdfBuffer.byteLength);
  new Uint8Array(arrayBuffer).set(pdfBuffer);

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bookings-${datestamp}.pdf"`,
    },
  });
}
