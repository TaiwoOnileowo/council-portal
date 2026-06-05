export const queryKeys = {
  currentUser: () => ["current-user"] as const,
  bookings: {
    all: (userId: string, filters?: object) =>
      filters
        ? (["bookings", userId, filters] as const)
        : (["bookings", userId] as const),
  },
  vendors: {
    all: () => ["vendors"] as const,
    detail: (id: string) => ["vendors", id] as const,
  },
  wallet: {
    all: (userId: string) => ["wallet", userId] as const,
  },
  banks: {
    all: () => ["banks", "NG"] as const,
  },
  vendor: {
    bookings: (userId: string, filters?: object) =>
      filters
        ? ["vendor", userId, "bookings", filters] as const
        : ["vendor", userId, "bookings"] as const,
    priceLists: (userId: string) => ["vendor", userId, "price-lists"] as const,
    availability: (userId: string) => ["vendor", userId, "availability"] as const,
  },
};
