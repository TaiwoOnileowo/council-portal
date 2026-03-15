export type IncomingBooking = {
  id: string;
  studentName: string;
  destination: string;
  date: string;
  time: string;
  rideType: "Private" | "Shared";
  price: string;
  status: "pending" | "accepted" | "declined";
};

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

export type EarningsData = {
  totalRides: number;
  totalEarnings: string;
  pendingPayouts: string;
};

export const vendorProfile = {
  name: "SwiftMove NG",
  tagline: "Fast & reliable campus-to-city rides",
  rating: 4.9,
  reviews: 214,
  initials: "SM",
};

export const earnings: EarningsData = {
  totalRides: 87,
  totalEarnings: "₦2,145,000",
  pendingPayouts: "₦185,500",
};

export const incomingBookings: IncomingBooking[] = [
  {
    id: "BK-001",
    studentName: "Chioma Nwosu",
    destination: "Yaba",
    date: "Mar 12, 2026",
    time: "2:30 PM",
    rideType: "Private",
    price: "₦8,500",
    status: "pending",
  },
  {
    id: "BK-002",
    studentName: "Emeka Ibe",
    destination: "Victoria Island",
    date: "Mar 12, 2026",
    time: "3:00 PM",
    rideType: "Shared",
    price: "₦12,000",
    status: "pending",
  },
  {
    id: "BK-003",
    studentName: "Fatima Bello",
    destination: "Ikeja",
    date: "Mar 12, 2026",
    time: "4:15 PM",
    rideType: "Private",
    price: "₦15,000",
    status: "pending",
  },
  {
    id: "BK-004",
    studentName: "David Adeyemi",
    destination: "Lekki Phase 1",
    date: "Mar 13, 2026",
    time: "8:00 AM",
    rideType: "Private",
    price: "₦18,000",
    status: "pending",
  },
  {
    id: "BK-005",
    studentName: "Grace Okonkwo",
    destination: "Surulere",
    date: "Mar 13, 2026",
    time: "10:30 AM",
    rideType: "Shared",
    price: "₦6,000",
    status: "pending",
  },
];

export const vendorPriceLists: PriceList[] = [
  {
    id: "PL-001",
    name: "Mar 2026 Resumption",
    direction: "leaving",
    routes: [
      { id: "R-001", name: "Yaba", price: 8500, capacity: 14, active: true },
      { id: "R-002", name: "Victoria Island", price: 25000, capacity: "unlimited", active: true },
      { id: "R-003", name: "Ikeja", price: 15000, capacity: 10, active: true },
      { id: "R-004", name: "Lekki Phase 1", price: 18000, capacity: 8, active: false },
    ],
    departureTimes: [
      { id: "DT-001", day: "Monday", time: "07:00" },
      { id: "DT-002", day: "Wednesday", time: "07:00" },
      { id: "DT-003", day: "Friday", time: "07:00" },
    ],
    luggagePolicy: "1 big bag + 1 hand luggage. Extra bags attract additional charge.",
    notes: "Contact driver 30 mins before departure.",
    availability: { type: "active" },
  },
  {
    id: "PL-002",
    name: "Dec 2025 End of Semester",
    direction: "leaving",
    routes: [
      { id: "R-005", name: "Surulere", price: 6000, capacity: 14, active: true },
      { id: "R-006", name: "Maryland", price: 10000, capacity: "unlimited", active: true },
    ],
    departureTimes: [
      { id: "DT-004", day: "Saturday", time: "09:00" },
    ],
    luggagePolicy: "",
    notes: "",
    availability: { type: "inactive" },
  },
  {
    id: "PL-003",
    name: "Mar 2026 Resumption",
    direction: "returning",
    routes: [
      { id: "R-007", name: "Yaba", price: 7500, capacity: 14, active: true },
      { id: "R-008", name: "Victoria Island", price: 22000, capacity: "unlimited", active: true },
    ],
    departureTimes: [
      { id: "DT-005", day: "Sunday", time: "14:00" },
      { id: "DT-006", day: "Sunday", time: "17:00" },
    ],
    luggagePolicy: "1 bag per passenger. No oversized items.",
    notes: "",
    availability: { type: "scheduled", startDate: "2026-04-01", endDate: "2026-04-30" },
  },
  {
    id: "PL-004",
    name: "Weekend Express",
    direction: "returning",
    routes: [
      { id: "R-009", name: "Ikeja", price: 13000, capacity: 10, active: true },
      { id: "R-010", name: "Maryland", price: 9000, capacity: "unlimited", active: true },
    ],
    departureTimes: [
      { id: "DT-007", day: "Saturday", time: "16:00" },
      { id: "DT-008", day: "Sunday", time: "18:00" },
    ],
    luggagePolicy: "",
    notes: "No food items allowed on board.",
    availability: { type: "active" },
  },
];
