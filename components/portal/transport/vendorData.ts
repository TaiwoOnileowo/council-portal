export type VendorLocation = {
  name: string;
  price: string;
  priceNum: number;
  estimatedTime: string;
};

export type VendorReview = {
  name: string;
  date: string;
  rating: number;
  comment: string;
};

export type Vendor = {
  name: string;
  tagline: string;
  about: string;
  logoBg: string;
  coverGradient: string;
  rating: number;
  reviews: number;
  fullStars: number;
  price: string;
  topRated: boolean;
  available: boolean;
  socials: { platform: string; handle: string }[];
  locations: VendorLocation[];
  reviewsList: VendorReview[];
};

export const vendors: Vendor[] = [
  {
    name: "SwiftMove NG",
    tagline: "Fast & reliable campus-to-city rides",
    about:
      "SwiftMove NG is Unilag's most trusted transport partner, providing premium rides across Lagos since 2022. All vehicles are GPS-tracked and drivers are verified.",
    logoBg: "bg-gradient-to-br from-blue-100 to-blue-200",
    coverGradient: "from-blue-500 to-blue-700",
    rating: 4.9,
    reviews: 214,
    fullStars: 5,
    price: "₦25,000",
    topRated: true,
    available: true,
    socials: [
      { platform: "Instagram", handle: "@swiftmove_ng" },
      { platform: "WhatsApp", handle: "+234 801 234 5678" },
      { platform: "Twitter", handle: "@SwiftMoveNG" },
    ],
    locations: [
      {
        name: "Yaba",
        price: "₦8,500",
        priceNum: 8500,
        estimatedTime: "15 min",
      },
      {
        name: "Ikeja",
        price: "₦15,000",
        priceNum: 15000,
        estimatedTime: "35 min",
      },
      {
        name: "Victoria Island",
        price: "₦25,000",
        priceNum: 25000,
        estimatedTime: "45 min",
      },
      {
        name: "Lekki Phase 1",
        price: "₦28,000",
        priceNum: 28000,
        estimatedTime: "55 min",
      },
      {
        name: "Surulere",
        price: "₦10,000",
        priceNum: 10000,
        estimatedTime: "20 min",
      },
      {
        name: "Maryland",
        price: "₦12,000",
        priceNum: 12000,
        estimatedTime: "25 min",
      },
      {
        name: "Oshodi",
        price: "₦14,000",
        priceNum: 14000,
        estimatedTime: "30 min",
      },
      {
        name: "Berger",
        price: "₦18,000",
        priceNum: 18000,
        estimatedTime: "40 min",
      },
    ],
    reviewsList: [
      {
        name: "Adebayo O.",
        date: "Mar 10, 2026",
        rating: 5,
        comment: "Very punctual and the car was clean. Will use again!",
      },
      {
        name: "Chioma N.",
        date: "Mar 8, 2026",
        rating: 5,
        comment: "Best vendor on campus hands down. Driver was professional.",
      },
      {
        name: "Emeka J.",
        date: "Mar 5, 2026",
        rating: 4,
        comment: "Good ride, arrived a few minutes late but great otherwise.",
      },
      {
        name: "Fatima H.",
        date: "Feb 28, 2026",
        rating: 5,
        comment: "Affordable for the distance. Highly recommend!",
      },
    ],
  },
  {
    name: "CampusLink",
    tagline: "Affordable shared shuttles for students",
    about:
      "CampusLink specializes in budget-friendly shared shuttle services tailored for students. Pool rides to save more and meet fellow students along the way.",
    logoBg: "bg-gradient-to-br from-red-100 to-red-200",
    coverGradient: "from-red-500 to-red-700",
    rating: 4.6,
    reviews: 189,
    fullStars: 4,
    price: "₦18,000",
    topRated: false,
    available: true,
    socials: [
      { platform: "Instagram", handle: "@campuslink" },
      { platform: "WhatsApp", handle: "+234 802 345 6789" },
    ],
    locations: [
      {
        name: "Yaba",
        price: "₦5,500",
        priceNum: 5500,
        estimatedTime: "20 min",
      },
      {
        name: "Ikeja",
        price: "₦10,000",
        priceNum: 10000,
        estimatedTime: "40 min",
      },
      {
        name: "Victoria Island",
        price: "₦18,000",
        priceNum: 18000,
        estimatedTime: "50 min",
      },
      {
        name: "Surulere",
        price: "₦7,000",
        priceNum: 7000,
        estimatedTime: "25 min",
      },
      {
        name: "Maryland",
        price: "₦8,500",
        priceNum: 8500,
        estimatedTime: "30 min",
      },
      {
        name: "Oshodi",
        price: "₦9,000",
        priceNum: 9000,
        estimatedTime: "35 min",
      },
    ],
    reviewsList: [
      {
        name: "Tunde A.",
        date: "Mar 9, 2026",
        rating: 5,
        comment: "So cheap for shared rides. Great for daily commute.",
      },
      {
        name: "Blessing E.",
        date: "Mar 6, 2026",
        rating: 4,
        comment:
          "Waited a while for the shuttle to fill up, but the price is unbeatable.",
      },
      {
        name: "David K.",
        date: "Mar 2, 2026",
        rating: 5,
        comment: "Clean shuttle and friendly driver. Top service.",
      },
    ],
  },
  {
    name: "UniRide Express",
    tagline: "Premium executive rides to anywhere",
    about:
      "UniRide Express offers executive-class transport with luxury SUVs and sedans. Perfect for airport runs, interviews, and premium travel across Lagos.",
    logoBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
    coverGradient: "from-emerald-500 to-emerald-700",
    rating: 4.8,
    reviews: 97,
    fullStars: 5,
    price: "₦35,000",
    topRated: false,
    available: true,
    socials: [
      { platform: "Instagram", handle: "@uniride_express" },
      { platform: "WhatsApp", handle: "+234 803 456 7890" },
      { platform: "Twitter", handle: "@UniRideXpress" },
    ],
    locations: [
      {
        name: "Yaba",
        price: "₦12,000",
        priceNum: 12000,
        estimatedTime: "12 min",
      },
      {
        name: "Ikeja",
        price: "₦22,000",
        priceNum: 22000,
        estimatedTime: "30 min",
      },
      {
        name: "Victoria Island",
        price: "₦35,000",
        priceNum: 35000,
        estimatedTime: "40 min",
      },
      {
        name: "Lekki Phase 1",
        price: "₦38,000",
        priceNum: 38000,
        estimatedTime: "50 min",
      },
      {
        name: "Airport (MM2)",
        price: "₦45,000",
        priceNum: 45000,
        estimatedTime: "55 min",
      },
      {
        name: "Ikoyi",
        price: "₦32,000",
        priceNum: 32000,
        estimatedTime: "38 min",
      },
    ],
    reviewsList: [
      {
        name: "Grace M.",
        date: "Mar 11, 2026",
        rating: 5,
        comment:
          "Took a ride to the airport. AC was on full, car was spotless.",
      },
      {
        name: "Kenneth U.",
        date: "Mar 7, 2026",
        rating: 5,
        comment: "Premium experience, totally worth the price.",
      },
    ],
  },
  {
    name: "SafeTrips Ltd",
    tagline: "Group-friendly SUVs with top safety",
    about:
      "SafeTrips Ltd provides large SUVs perfect for group travel. All vehicles are fitted with dashcams and track systems for maximum safety.",
    logoBg: "bg-gradient-to-br from-violet-100 to-violet-200",
    coverGradient: "from-violet-500 to-violet-700",
    rating: 4.5,
    reviews: 143,
    fullStars: 4,
    price: "₦28,000",
    topRated: false,
    available: false,
    socials: [
      { platform: "Instagram", handle: "@safetrips_ltd" },
      { platform: "WhatsApp", handle: "+234 804 567 8901" },
    ],
    locations: [
      {
        name: "Yaba",
        price: "₦10,000",
        priceNum: 10000,
        estimatedTime: "18 min",
      },
      {
        name: "Ikeja",
        price: "₦18,000",
        priceNum: 18000,
        estimatedTime: "38 min",
      },
      {
        name: "Victoria Island",
        price: "₦28,000",
        priceNum: 28000,
        estimatedTime: "48 min",
      },
      {
        name: "Lekki Phase 1",
        price: "₦32,000",
        priceNum: 32000,
        estimatedTime: "58 min",
      },
      {
        name: "Surulere",
        price: "₦12,000",
        priceNum: 12000,
        estimatedTime: "22 min",
      },
    ],
    reviewsList: [
      {
        name: "Yusuf B.",
        date: "Mar 4, 2026",
        rating: 4,
        comment: "Great for travelling in a group. SUV was spacious.",
      },
      {
        name: "Linda O.",
        date: "Feb 25, 2026",
        rating: 5,
        comment: "Felt safe the entire trip. Dashcam is a nice touch.",
      },
      {
        name: "Aisha S.",
        date: "Feb 20, 2026",
        rating: 4,
        comment: "Driver was professional, though we had a slight delay.",
      },
    ],
  },
  {
    name: "GoFast Motors",
    tagline: "Budget-friendly shuttles across Lagos",
    about:
      "GoFast Motors runs no-frills shuttle routes across Lagos at the lowest prices. Ideal for students on a tight budget who need to get around.",
    logoBg: "bg-gradient-to-br from-amber-100 to-amber-200",
    coverGradient: "from-amber-500 to-amber-700",
    rating: 4.3,
    reviews: 78,
    fullStars: 4,
    price: "₦22,000",
    topRated: false,
    available: true,
    socials: [{ platform: "WhatsApp", handle: "+234 805 678 9012" }],
    locations: [
      {
        name: "Yaba",
        price: "₦4,500",
        priceNum: 4500,
        estimatedTime: "18 min",
      },
      {
        name: "Ikeja",
        price: "₦9,000",
        priceNum: 9000,
        estimatedTime: "40 min",
      },
      {
        name: "Oshodi",
        price: "₦8,000",
        priceNum: 8000,
        estimatedTime: "35 min",
      },
      {
        name: "Ketu",
        price: "₦12,000",
        priceNum: 12000,
        estimatedTime: "45 min",
      },
      {
        name: "Berger",
        price: "₦14,000",
        priceNum: 14000,
        estimatedTime: "50 min",
      },
    ],
    reviewsList: [
      {
        name: "Samuel A.",
        date: "Mar 3, 2026",
        rating: 4,
        comment: "Cheapest option for getting to Oshodi. No complaints.",
      },
      {
        name: "Joy C.",
        date: "Feb 18, 2026",
        rating: 4,
        comment: "Budget-friendly and reliable. Just what I needed.",
      },
    ],
  },
];
