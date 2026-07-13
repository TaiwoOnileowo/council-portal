-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "stop_name" TEXT;

-- CreateTable
CREATE TABLE "route_stop" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "route_stop_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "route_stop" ADD CONSTRAINT "route_stop_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "price_list_route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
