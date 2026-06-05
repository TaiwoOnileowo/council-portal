/*
  Warnings:

  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DepartureTime` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceList` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceListRoute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vendor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('TRANSPORT');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_routeId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "DepartureTime" DROP CONSTRAINT "DepartureTime_priceListId_fkey";

-- DropForeignKey
ALTER TABLE "PriceList" DROP CONSTRAINT "PriceList_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "PriceListRoute" DROP CONSTRAINT "PriceListRoute_priceListId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_walletId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- DropTable
DROP TABLE "Booking";

-- DropTable
DROP TABLE "DepartureTime";

-- DropTable
DROP TABLE "PriceList";

-- DropTable
DROP TABLE "PriceListRoute";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Vendor";

-- DropTable
DROP TABLE "Wallet";

-- DropEnum
DROP TYPE "TransactionStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profile" (
    "user_id" TEXT NOT NULL,
    "matric_number" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "level" "Level" NOT NULL,

    CONSTRAINT "student_profile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "vendor_profile" (
    "user_id" TEXT NOT NULL,
    "category" "VendorCategory" NOT NULL DEFAULT 'TRANSPORT',
    "business_name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "tiktok" TEXT,
    "instagram" TEXT,
    "bank_code" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vendor_profile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "wallet" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reason" TEXT NOT NULL,
    "type" TEXT,
    "model_responsible" TEXT,
    "model_id" TEXT,
    "reference" TEXT,
    "domain" TEXT NOT NULL DEFAULT 'live',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" "PriceListDirection" NOT NULL,
    "luggage_policy" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "availability_type" "AvailabilityType" NOT NULL DEFAULT 'ACTIVE',
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_route" (
    "id" TEXT NOT NULL,
    "price_list_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "price_list_route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departure_time" (
    "id" TEXT NOT NULL,
    "price_list_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "departure_time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "flw_ref" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "passenger_name" TEXT NOT NULL,
    "passenger_phone" TEXT NOT NULL,
    "parents_phone" TEXT NOT NULL,
    "hall" TEXT NOT NULL,
    "room_number" TEXT NOT NULL,
    "direction" "PriceListDirection" NOT NULL,
    "route_name" TEXT NOT NULL,
    "fare" INTEGER NOT NULL,
    "service_fee" INTEGER NOT NULL,
    "student_notes" TEXT,
    "user_id" TEXT,
    "vendor_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "student_profile_matric_number_key" ON "student_profile"("matric_number");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_reference_key" ON "wallet"("reference");

-- CreateIndex
CREATE INDEX "wallet_user_id_created_at_idx" ON "wallet"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_vendor_id_direction_key" ON "price_list"("vendor_id", "direction");

-- CreateIndex
CREATE UNIQUE INDEX "booking_reference_key" ON "booking"("reference");

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_profile" ADD CONSTRAINT "vendor_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list" ADD CONSTRAINT "price_list_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor_profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_route" ADD CONSTRAINT "price_list_route_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departure_time" ADD CONSTRAINT "departure_time_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor_profile"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "price_list_route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
