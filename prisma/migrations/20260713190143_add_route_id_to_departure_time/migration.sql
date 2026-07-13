-- AlterTable
ALTER TABLE "departure_time" ADD COLUMN     "route_id" TEXT;

-- AddForeignKey
ALTER TABLE "departure_time" ADD CONSTRAINT "departure_time_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "price_list_route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
