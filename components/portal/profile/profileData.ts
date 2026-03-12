export type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: string;
  department: string;
  faculty: string;
  avatar: string | null; // URL or null for initials fallback
};

export type UserReview = {
  id: string;
  vendorName: string;
  vendorLogoBg: string;
  rating: number;
  comment: string;
  date: string;
};

export const mockProfile: UserProfile = {
  firstName: "Adeola",
  lastName: "Okafor",
  email: "adeola.okafor@student.cu.edu.ng",
  phone: "+234 812 345 6789",
  matricNumber: "23CG034136",
  level: "300L",
  department: "Computer Science",
  faculty: "College of Science & Technology",
  avatar: null,
};

export const mockReviews: UserReview[] = [
  {
    id: "1",
    vendorName: "SwiftMove NG",
    vendorLogoBg: "bg-gradient-to-br from-blue-100 to-blue-200",
    rating: 5,
    comment:
      "Amazing service! The driver was punctual and the car was clean. Will definitely book again for my next trip to Berger.",
    date: "Mar 8, 2026",
  },
  {
    id: "2",
    vendorName: "CampusLink",
    vendorLogoBg: "bg-gradient-to-br from-red-100 to-red-200",
    rating: 4,
    comment:
      "Good ride overall. The pickup was slightly delayed but the driver made up for it with a smooth journey.",
    date: "Feb 22, 2026",
  },
  {
    id: "3",
    vendorName: "UniRide Express",
    vendorLogoBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
    rating: 5,
    comment:
      "Best vendor I've used so far. AC was working perfectly and the driver knew the fastest route.",
    date: "Feb 10, 2026",
  },
];
