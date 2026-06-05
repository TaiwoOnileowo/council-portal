import { z } from "zod";


export const priceListBodySchema = z.object({
  name: z
    .string()
    .min(1, "Price list name is required")
    .max(80, "Name must be 80 characters or less"),
  direction: z.enum(["leaving", "returning"]),
  routes: z
    .array(
      z.object({
        name: z.string().min(1, "Route name is required"),
        price: z.number().int().min(0, "Price must be 0 or more"),
        capacity: z
          .number()
          .int()
          .min(1, "Capacity must be at least 1")
          .nullable(),
        active: z.boolean(),
      }),
    )
    .min(1, "At least one route is required"),
  departureTimes: z
    .array(
      z.object({
        day: z.string().min(1),
        time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      }),
    )
    .min(1, "At least one departure time is required"),
  luggagePolicy: z.string().max(500).optional().default(""),
  notes: z.string().max(500).optional().default(""),
  availability: z.discriminatedUnion("type", [
    z.object({ type: z.literal("active") }),
    z.object({ type: z.literal("inactive") }),
    z.object({
      type: z.literal("scheduled"),
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    }),
  ]),
});

export type PriceListBody = z.infer<typeof priceListBodySchema>;

export type PriceListRoute = {
  id: string;
  name: string;
  price: number;
  capacity: number | "unlimited";
  active: boolean;
};

export type PriceListAvailability =
  | { type: "active" }
  | { type: "inactive" }
  | { type: "scheduled"; startDate: string; endDate: string };

export type DepartureTime = {
  id: string;
  day: string;
  time: string;
};

export type PriceList = {
  id: string;
  name: string;
  direction: "leaving" | "returning";
  routes: PriceListRoute[];
  departureTimes: DepartureTime[];
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
  direction: "LEAVING" | "RETURNING";
  fare: number;
  studentNotes: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";
  createdAt: string;
};

export type TransportBookingsResponse = {
  bookings: TransportBooking[];
  routes: string[];
};

export type BookingsFilters = {
  tab: "upcoming" | "past";
  route: string;
  dateFrom: string;
  dateTo: string;
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
