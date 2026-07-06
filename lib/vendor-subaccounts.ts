import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { paystackService } from "@/lib/payment-processors/paystack";
import { flutterwaveService } from "@/lib/payment-processors/flutterwave";
import type { SubaccountBankDetails } from "@/lib/payment-processors/types";

// Self-healing: creates a subaccount for a processor the vendor doesn't have
// one on yet, or updates the existing one to match current bank details
// otherwise — safe to call any time bank details are saved. Best-effort and
// independent per processor: one failing (logged + alerted via `logger`,
// inside each processor's own create/update function) never blocks the
// other or the vendor's profile save.
export async function syncVendorSubaccounts(vendorId: string): Promise<void> {
  const vendor = await db.vendor_profile.findUnique({
    where: { user_id: vendorId },
    select: {
      business_name: true,
      bank_code: true,
      bank_name: true,
      account_number: true,
      paystack_subaccount_code: true,
      flutterwave_subaccount_id: true,
      user: { select: { phone: true, email: true } },
    },
  });

  if (!vendor?.bank_code || !vendor.bank_name || !vendor.account_number) return;

  const bank: SubaccountBankDetails = {
    bankCode: vendor.bank_code,
    bankName: vendor.bank_name,
    accountNumber: vendor.account_number,
    businessName: vendor.business_name,
    businessMobile: vendor.user.phone,
    businessEmail: vendor.user.email,
  };

  const [paystackCode, flutterwaveId] = await Promise.all([
    vendor.paystack_subaccount_code
      ? paystackService
          .updateSubaccount(vendor.paystack_subaccount_code, bank)
          .then(() => undefined)
      : paystackService.createSubaccount(bank),
    vendor.flutterwave_subaccount_id
      ? flutterwaveService
          .updateSubaccount(vendor.flutterwave_subaccount_id, bank)
          .then(() => undefined)
      : flutterwaveService.createSubaccount(bank),
  ]);

  const data: Prisma.vendor_profileUpdateInput = {};
  if (paystackCode) data.paystack_subaccount_code = paystackCode;
  if (flutterwaveId) data.flutterwave_subaccount_id = flutterwaveId;

  if (Object.keys(data).length > 0) {
    await db.vendor_profile.update({ where: { user_id: vendorId }, data });
  }
}
