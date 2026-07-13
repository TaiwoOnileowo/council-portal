/*
  Warnings:

  - You are about to drop the column `price_list_id` on the `departure_time` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `price_list_route` table. All the data in the column will be lost.
  - Made the column `route_id` on table `departure_time` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "departure_time" DROP CONSTRAINT "departure_time_price_list_id_fkey";

-- AlterTable
ALTER TABLE "departure_time" DROP COLUMN "price_list_id",
ALTER COLUMN "route_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "price_list_route" DROP COLUMN "capacity";
