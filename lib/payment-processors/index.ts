import { flutterwaveProcessor } from "./flutterwave";
import { paystackProcessor } from "./paystack";
import type { PaymentProcessor } from "./types";

export const PAYMENT_PROCESSORS: Record<string, PaymentProcessor> = {
  flutterwave: flutterwaveProcessor,
  paystack: paystackProcessor,
};

export type {
  PaymentProcessor,
  InitiateChargeInput,
  InitiateChargeResult,
} from "./types";
