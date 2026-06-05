/*
  Warnings:

  - You are about to drop the column `day` on the `departure_time` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `departure_time` table. All the data in the column will be lost.
  - Added the required column `departs_at` to the `departure_time` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "destination_address" TEXT;

-- AlterTable
ALTER TABLE "departure_time" DROP COLUMN "day",
DROP COLUMN "time",
ADD COLUMN     "departs_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "booking_vendor_id_status_created_at_idx" ON "booking"("vendor_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "booking_vendor_id_route_name_idx" ON "booking"("vendor_id", "route_name");

-- CreateIndex
CREATE INDEX "booking_user_id_created_at_idx" ON "booking"("user_id", "created_at");
