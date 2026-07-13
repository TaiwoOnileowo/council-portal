import { format } from "date-fns";
import type { PriceList, PriceListRoute, PriceListBody, DepartureTime } from "@/modules/transport/transport.types";
import { parseAmount } from "@/lib/format";
import type { PublicVendor, PublicPriceList } from "@/lib/actions/transport.action";

export type DrawerFormValues = {
  name: string;
  direction: "leaving" | "returning";
  routes: Array<{
    id?: string;
    name: string;
    price: string;
    active: boolean;
    stops: Array<{ name: string }>;
    departureTimes: Array<{
      date: string;
      time: string;
      capacityType: "number" | "unlimited";
      capacityValue: string;
    }>;
  }>;
  luggagePolicy: string;
  notes: string;
  availType: "active" | "inactive" | "scheduled";
  schedStart: string;
  schedEnd: string;
};

export function draftFromRoute(r: PriceListRoute) {
  return {
    id: r.id,
    name: r.name,
    price: r.price > 0 ? r.price.toLocaleString("en-NG") : "",
    active: r.active,
    stops: [...r.stops]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ name: s.name })),
    departureTimes: r.departureTimes.map((dt: DepartureTime) => {
      const d = new Date(dt.departsAt);
      return {
        date: format(d, "yyyy-MM-dd"),
        time: format(d, "HH:mm"),
        capacityType: (dt.capacity === "unlimited" ? "unlimited" : "number") as
          | "number"
          | "unlimited",
        capacityValue: dt.capacity === "unlimited" ? "" : String(dt.capacity),
      };
    }),
  };
}

export function formValuesFromPriceList(pl: PriceList): DrawerFormValues {
  return {
    name: pl.name,
    direction: pl.direction,
    routes: pl.routes.map(draftFromRoute),
    luggagePolicy: pl.luggagePolicy,
    notes: pl.notes,
    availType: pl.availability.type,
    schedStart: pl.availability.type === "scheduled" ? pl.availability.startDate : "",
    schedEnd: pl.availability.type === "scheduled" ? pl.availability.endDate : "",
  };
}

export function buildBody(form: DrawerFormValues): PriceListBody {
  const availability: PriceListBody["availability"] =
    form.availType === "scheduled"
      ? { type: "scheduled", startDate: form.schedStart, endDate: form.schedEnd }
      : form.availType === "inactive"
        ? { type: "inactive" }
        : { type: "active" };

  return {
    name: form.name.trim(),
    direction: form.direction,
    routes: form.routes.map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      name: r.name.trim(),
      price: parseAmount(r.price),
      active: r.active,
      stops: r.stops
        .map((s) => ({ name: s.name.trim() }))
        .filter((s) => s.name.length > 0),
      departureTimes: r.departureTimes.map((d) => ({
        departsAt:
          d.date && d.time
            ? new Date(`${d.date}T${d.time}:00`).toISOString()
            : "",
        capacity:
          d.capacityType === "unlimited"
            ? null
            : Math.max(1, parseInt(d.capacityValue, 10) || 1),
      })),
    })),
    luggagePolicy: form.luggagePolicy,
    notes: form.notes,
    availability,
  };
}

export function isPriceListActive(pl: PublicPriceList): boolean {
  if (pl.availType === "ACTIVE") return true;
  if (pl.availType === "INACTIVE") return false;
  const now = new Date();
  if (pl.schedStart && now < pl.schedStart) return false;
  if (pl.schedEnd && now > pl.schedEnd) return false;
  return true;
}

export function closesToday(pl: PublicPriceList): boolean {
  if (!pl.schedEnd) return false;
  const today = new Date().toDateString();
  return new Date(pl.schedEnd).toDateString() === today;
}

export function closesSoon(pl: PublicPriceList): boolean {
  if (!pl.schedEnd || closesToday(pl)) return false;
  const diff = new Date(pl.schedEnd).getTime() - new Date().getTime();
  return diff > 0 && diff <= 2 * 24 * 60 * 60 * 1000;
}

export function isPriceListFull(pl: PublicPriceList): boolean {
  return pl.routes.length > 0 && pl.routes.every((r) => r.isFull);
}

export function isVendorAvailable(vendor: PublicVendor): boolean {
  if (!vendor.isActive) return false;
  const now = new Date();
  return vendor.priceLists.some((pl) => {
    if (pl.availType === "ACTIVE") return true;
    if (pl.availType === "INACTIVE") return false;
    if (pl.schedStart && now < pl.schedStart) return false;
    if (pl.schedEnd && now > pl.schedEnd) return false;
    return true;
  });
}

export function priceListDraftKey(direction: "leaving" | "returning", id: string | null): string {
  return `priceListDraft:${direction}:${id ?? "new"}`;
}

export function emptyFormValues(direction: "leaving" | "returning"): DrawerFormValues {
  return {
    name: direction === "leaving" ? "Leaving School" : "Returning to School",
    direction,
    routes: [],
    luggagePolicy: "",
    notes: "",
    availType: "active",
    schedStart: "",
    schedEnd: "",
  };
}
