-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "commission" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "wallet" ADD COLUMN     "vendor_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "payout" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "bank_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "flw_transfer_id" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payout_reference_key" ON "payout"("reference");

-- CreateIndex
CREATE INDEX "payout_vendor_id_created_at_idx" ON "payout"("vendor_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_vendor_id_created_at_idx" ON "wallet"("vendor_id", "created_at");

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor_profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout" ADD CONSTRAINT "payout_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor_profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
