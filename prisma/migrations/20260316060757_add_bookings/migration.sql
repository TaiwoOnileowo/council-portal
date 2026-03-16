-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "flwRef" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "passengerName" TEXT NOT NULL,
    "passengerPhone" TEXT NOT NULL,
    "parentsPhone" TEXT NOT NULL,
    "hall" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "direction" "PriceListDirection" NOT NULL,
    "routeName" TEXT NOT NULL,
    "fare" INTEGER NOT NULL,
    "serviceFee" INTEGER NOT NULL,
    "userId" TEXT,
    "vendorId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "PriceListRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
