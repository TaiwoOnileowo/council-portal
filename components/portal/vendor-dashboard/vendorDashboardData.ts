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
  from: string;
  to: string;
  goingPrice: number;
  returnPrice: number;
  capacity: number | "unlimited";
  active: boolean;
  unavailability?: {
    startDate: string;
    endDate: string;
  };
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
    from: "University Gate",
    to: "Yaba",
    goingPrice: 8500,
    returnPrice: 7500,
    capacity: 14,
    active: true,
  },
  {
    id: "RT-002",
    from: "University Gate",
    to: "Victoria Island",
    goingPrice: 25000,
    returnPrice: 22000,
    capacity: "unlimited",
    active: true,
  },
  {
    id: "RT-003",
    from: "University Gate",
    to: "Ikeja",
    goingPrice: 15000,
    returnPrice: 13000,
    capacity: 10,
    active: true,
  },
  {
    id: "RT-004",
    from: "University Gate",
    to: "Lekki Phase 1",
    goingPrice: 18000,
    returnPrice: 16000,
    capacity: 8,
    active: false,
  },
  {
    id: "RT-005",
    from: "University Gate",
    to: "Surulere",
    goingPrice: 6000,
    returnPrice: 5500,
    capacity: 14,
    active: true,
  },
  {
    id: "RT-006",
    from: "University Gate",
    to: "Maryland",
    goingPrice: 10000,
    returnPrice: 9000,
    capacity: "unlimited",
    active: true,
  },
];
