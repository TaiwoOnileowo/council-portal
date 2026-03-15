-- CreateEnum
CREATE TYPE "PriceListDirection" AS ENUM ('LEAVING', 'RETURNING');

-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('ACTIVE', 'INACTIVE', 'SCHEDULED');

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" "PriceListDirection" NOT NULL,
    "luggagePolicy" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "availType" "AvailabilityType" NOT NULL DEFAULT 'ACTIVE',
    "schedStart" TIMESTAMP(3),
    "schedEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListRoute" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PriceListRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartureTime" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "DepartureTime_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListRoute" ADD CONSTRAINT "PriceListRoute_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureTime" ADD CONSTRAINT "DepartureTime_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
