/*
  Warnings:

  - A unique constraint covering the columns `[vendorId,direction]` on the table `PriceList` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PriceList_vendorId_direction_key" ON "PriceList"("vendorId", "direction");
