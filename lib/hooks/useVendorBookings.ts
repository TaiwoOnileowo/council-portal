import { useQuery } from "@tanstack/react-query";

export type VendorBooking = {
  id: string;
  reference: string;
  passengerName: string;
  passengerPhone: string;
  routeName: string;
  direction: "LEAVING" | "RETURNING";
  fare: number;
  studentNotes: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";
  createdAt: string;
};

export type VendorBookingsResponse = {
  bookings: VendorBooking[];
  routes: string[];
};

export type BookingsFilters = {
  tab: "upcoming" | "past";
  route: string;
  dateFrom: string;
  dateTo: string;
};

export function useVendorBookings(filters: BookingsFilters) {
  const params = new URLSearchParams({ tab: filters.tab, route: filters.route });
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);

  return useQuery<VendorBookingsResponse>({
    queryKey: ["vendor", "bookings", filters],
    queryFn: async () => {
      const res = await fetch(`/api/vendor/bookings?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json() as Promise<VendorBookingsResponse>;
    },
  });
}
