import { z } from "zod";
import { MIN_ROUTE_PRICE_NAIRA } from "@/lib/money";

export const priceListBodySchema = z.object({
  name: z
    .string()
    .min(1, "Price list name is required")
    .max(80, "Name must be 80 characters or less"),
  direction: z.enum(["leaving", "returning"]),
  routes: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Route name is required"),
        price: z
          .number()
          .int()
          .min(
            MIN_ROUTE_PRICE_NAIRA,
            `Price must be at least ₦${MIN_ROUTE_PRICE_NAIRA.toLocaleString("en-NG")}`,
          ),
        active: z.boolean(),
        stops: z
          .array(
            z.object({
              name: z.string().min(1, "Stop name is required").max(80),
            }),
          )
          .default([]),
        departureTimes: z
          .array(
            z.object({
              departsAt: z.string().datetime("Invalid departure date/time"),
              capacity: z
                .number()
                .int()
                .min(1, "Capacity must be at least 1")
                .nullable(),
            }),
          )
          .min(1, "At least one departure time is required"),
      }),
    )
    .min(1, "At least one route is required"),
  luggagePolicy: z
    .string()
    .max(500, "Luggage policy must be 500 characters or less")
    .optional()
    .default(""),
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or less")
    .optional()
    .default(""),
  availability: z.discriminatedUnion("type", [
    z.object({ type: z.literal("active") }),
    z.object({ type: z.literal("inactive") }),
    z.object({
      type: z.literal("scheduled"),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    }),
  ]),
});

export type PriceListBody = z.infer<typeof priceListBodySchema>;

export type PriceListStop = {
  id: string;
  name: string;
  order: number;
};

export type PriceListRoute = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  stops: PriceListStop[];
  departureTimes: DepartureTime[];
};

export type PriceListAvailability =
  | { type: "active" }
  | { type: "inactive" }
  | { type: "scheduled"; startDate: string; endDate: string };

export type DepartureTime = {
  id: string;
  departsAt: string; // ISO datetime
  capacity: number | "unlimited";
};

export type PriceList = {
  id: string;
  name: string;
  direction: "leaving" | "returning";
  routes: PriceListRoute[];
  luggagePolicy: string;
  notes: string;
  availability: PriceListAvailability;
};

export type TransportBooking = {
  id: string;
  reference: string;
  passengerName: string;
  passengerPhone: string;
  parentsPhone: string;
  hall: string;
  roomNumber: string;
  routeName: string;
  vendorName: string;
  direction: "LEAVING" | "RETURNING";
  fare: number;
  commission: number;
  studentNotes: string | null;
  destinationAddress: string | null;
  stopName: string | null;
  departureAt: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";
  createdAt: string;
};

export const VENDOR_BOOKINGS_PAGE_SIZE = 20;
export const STUDENT_BOOKINGS_PAGE_SIZE = 20;

export type TransportBookingsResponse = {
  bookings: TransportBooking[];
  routes: string[];
  routeCounts: Record<string, number>;
  total: number;
};

export type BookingsFilters = {
  vendorId?: string;
  route: string;
  dateFrom: string;
  dateTo: string;
  departureDateFrom?: string;
  departureDateTo?: string;
  search: string;
  page: number;
};

export type StudentBooking = {
  id: string;
  reference: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";
  passengerName: string;
  passengerPhone: string;
  parentsPhone: string;
  hall: string;
  roomNumber: string;
  direction: "LEAVING" | "RETURNING";
  routeName: string;
  fare: number;
  serviceFee: number;
  studentNotes: string | null;
  destinationAddress: string | null;
  stopName: string | null;
  departureAt: string | null;
  createdAt: string;
  vendor: {
    transportName: string;
    phone: string | null;
    image: string | null;
  };
  route: {
    priceList: {
      luggagePolicy: string;
      notes: string;
    };
  };
};

export type StudentBookingsFilters = {
  vendorId: string;
  search: string;
  page: number;
};

export type StudentBookingsResponse = {
  bookings: StudentBooking[];
  vendors: { id: string; name: string }[];
  total: number;
};

export const bookingCheckoutMetadataSchema = z.object({
  vendorId: z.string(),
  routeId: z.string(),
  direction: z.enum(["LEAVING", "RETURNING"]),
  passengerName: z.string(),
  passengerPhone: z.string(),
  parentsPhone: z.string(),
  hall: z.string(),
  roomNumber: z.string(),
  routeName: z.string(),
  fare: z.number(),
  serviceFee: z.number(),
  commissionNaira: z.number(),
  studentNotes: z.string().nullable(),
  destinationAddress: z.string(),
  stopName: z.string().nullable(),
  departureAt: z.string().nullable(),
  // Whether the charge actually split at the processor when it was started —
  // recorded once, at checkout time, so the webhook (which may fire long
  // after `payment_config.splitPaymentsEnabled` could have been toggled)
  // finalizes based on what really happened to the money, not the live
  // setting. Defaults false so a stray pre-existing PENDING payment from
  // before this field existed parses as "credit the wallet", the only mode
  // that ever ran before split payments existed.
  splitPayment: z.boolean().default(false),
});

export type BookingCheckoutMetadata = z.infer<
  typeof bookingCheckoutMetadataSchema
>;

export type ExportFilters = {
  vendorId?: string;
  direction: "all" | "LEAVING" | "RETURNING";
  route: string;
  bookingDateFrom: string;
  bookingDateTo: string;
  departureDateFrom: string;
  departureDateTo: string;
};
