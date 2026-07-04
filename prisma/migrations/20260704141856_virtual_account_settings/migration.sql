-- CreateTable
CREATE TABLE "app_setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "vendor_id" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'flutterwave',
    "account_number" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_code" TEXT,
    "tx_ref" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_setting_key_key" ON "app_setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_account_user_id_key" ON "virtual_account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_account_vendor_id_key" ON "virtual_account"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_account_tx_ref_key" ON "virtual_account"("tx_ref");

-- AddForeignKey
ALTER TABLE "virtual_account" ADD CONSTRAINT "virtual_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_account" ADD CONSTRAINT "virtual_account_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor_profile"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
