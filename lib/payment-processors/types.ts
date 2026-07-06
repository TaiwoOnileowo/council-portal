export type InitiateChargeInput = {
  reference: string;
  amountKobo: number;
  email: string;
  name: string;
  redirectUrl: string;
  // When set, the charge splits at the processor — no internal wallet
  // credit needed, the vendor's cut settles straight to their subaccount.
  // Both amounts are provided (they sum to amountKobo, before any processor
  // fee) because which side absorbs that processor's own fee depends on
  // the processor: Paystack's `bearer` already defaults to the main account
  // eating its fee, so it uses platformFeeKobo directly; Flutterwave has no
  // such toggle — its fee comes out of whichever side is "the remainder",
  // so it fixes vendorPayoutKobo instead and lets its own fee erode our cut.
  split?: {
    subaccountId: string;
    vendorPayoutKobo: number;
    platformFeeKobo: number;
  };
};

export type InitiateChargeResult =
  | { authorizationUrl: string }
  | { error: string };

export interface PaymentProcessor {
  initiateCharge(input: InitiateChargeInput): Promise<InitiateChargeResult>;
}

export type SubaccountBankDetails = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  businessName: string;
  businessMobile: string;
  businessEmail: string;
};
