export type StudentBooking = {
  id: string;
  reference: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";
  passengerName: string;
  passengerPhone: string;
  parentsPhone: string;
  hall: string;
  roomNumber: string;
  direction: "LEAVING" | "RETURNING";
  routeName: string;
  fare: number;
  serviceFee: number;
  studentNotes: string | null;
  createdAt: string;
  vendor: {
    transportName: string;
    phone: string | null;
    image: string | null;
  };
  route: {
    priceList: {
      luggagePolicy: string;
      notes: string;
    };
  };
};
