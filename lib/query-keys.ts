export const queryKeys = {
  bookings: {
    all: () => ["bookings"] as const,
  },
  vendors: {
    all: () => ["vendors"] as const,
    detail: (id: string) => ["vendors", id] as const,
  },
  wallet: {
    all: () => ["wallet"] as const,
  },
  banks: {
    all: () => ["banks", "NG"] as const,
  },
  vendor: {
    bookings: (filters?: object) =>
      filters ? ["vendor", "bookings", filters] as const : ["vendor", "bookings"] as const,
    priceLists: () => ["vendor", "price-lists"] as const,
    availability: () => ["vendor", "availability"] as const,
  },
};
