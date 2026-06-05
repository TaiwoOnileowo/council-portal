import type { PriceList, PriceListRoute, PriceListBody, DepartureTime } from "@/modules/transport/transport.types";
import { parseAmount } from "@/lib/format";

export type DrawerFormValues = {
  name: string;
  direction: "leaving" | "returning";
  routes: Array<{
    name: string;
    price: string;
    capacityType: "number" | "unlimited";
    capacityValue: string;
    active: boolean;
  }>;
  departureTimes: Array<{ day: string; time: string }>;
  luggagePolicy: string;
  notes: string;
  availType: "active" | "inactive" | "scheduled";
  schedStart: string;
  schedEnd: string;
};

export function draftFromRoute(r: PriceListRoute) {
  return {
    name: r.name,
    price: r.price > 0 ? r.price.toLocaleString("en-NG") : "",
    capacityType: (r.capacity === "unlimited" ? "unlimited" : "number") as "number" | "unlimited",
    capacityValue: r.capacity === "unlimited" ? "" : String(r.capacity),
    active: r.active,
  };
}

export function formValuesFromPriceList(pl: PriceList): DrawerFormValues {
  return {
    name: pl.name,
    direction: pl.direction,
    routes: pl.routes.map(draftFromRoute),
    departureTimes: pl.departureTimes.map((dt: DepartureTime) => ({
      day: dt.day,
      time: dt.time,
    })),
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
      name: r.name.trim(),
      price: parseAmount(r.price),
      capacity:
        r.capacityType === "unlimited" ? null : Math.max(1, parseInt(r.capacityValue, 10) || 1),
      active: r.active,
    })),
    departureTimes: form.departureTimes.map((d) => ({ day: d.day, time: d.time })),
    luggagePolicy: form.luggagePolicy,
    notes: form.notes,
    availability,
  };
}

export function emptyFormValues(direction: "leaving" | "returning"): DrawerFormValues {
  return {
    name: "",
    direction,
    routes: [],
    departureTimes: [],
    luggagePolicy: "",
    notes: "",
    availType: "active",
    schedStart: "",
    schedEnd: "",
  };
}
