import { flutterwaveService } from "./flutterwave";
import { paystackService } from "./paystack";
import type { PaymentProcessor } from "./types";

export const PAYMENT_PROCESSORS: Record<string, PaymentProcessor> = {
  flutterwave: flutterwaveService,
  paystack: paystackService,
};

export type {
  PaymentProcessor,
  InitiateChargeInput,
  InitiateChargeResult,
} from "./types";
