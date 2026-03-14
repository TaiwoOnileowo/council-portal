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

export type Route = {
  id: string;
  destination: string;
  price: number;
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

export const vendorRoutes: Route[] = [
  {
    id: "RT-001",
    destination: "Yaba",
    price: "₦8,500",
    priceNum: 8500,
    estimatedTime: "25 mins",
  },
  {
    id: "RT-002",
    destination: "Victoria Island",
    price: "₦25,000",
    priceNum: 25000,
    estimatedTime: "55 mins",
  },
  {
    id: "RT-003",
    destination: "Ikeja",
    price: "₦15,000",
    priceNum: 15000,
    estimatedTime: "40 mins",
  },
  {
    id: "RT-004",
    destination: "Lekki Phase 1",
    price: "₦18,000",
    priceNum: 18000,
    estimatedTime: "50 mins",
  },
  {
    id: "RT-005",
    destination: "Surulere",
    price: "₦6,000",
    priceNum: 6000,
    estimatedTime: "20 mins",
  },
  {
    id: "RT-006",
    destination: "Maryland",
    price: "₦10,000",
    priceNum: 10000,
    estimatedTime: "30 mins",
  },
];
