import { z } from "zod";

export const SETTINGS_REGISTRY = {
  approved_vendors: {
    label: "Approved vendor emails",
    description:
      "Emails allowed to sign up as a transport vendor without manual approval.",
    schema: z.array(z.string().trim().toLowerCase().email()),
    default: [
      "taiwoonileowo17@gmail.com",
      "Sratnigeria@gmail.com",
      "movelitehq@gmail.com",
      "Hellosnugride@gmail.com",
      "swift.rides.official@gmail.com",
      "tobilobaarogundade07@gmail.com",
      "davidcityconsulting247@gmail.com",
    ] as string[],
  },
  booking_pricing_config: {
    label: "Booking pricing",
    description:
      "Commission taken from vendor earnings, minimum vendor withdrawal, and the customer-facing service fee.",
    schema: z.object({
      commissionNaira: z.number().int().min(0),
      minPayoutNaira: z.number().int().min(0),
      serviceFeeNaira: z.number().int().min(0),
    }),
    default: {
      commissionNaira: 1000,
      minPayoutNaira: 1000,
      serviceFeeNaira: 0,
    },
  },
  active_payment_processor: {
    label: "Active payment processor",
    description:
      "Which processor handles new payment attempts (top-ups, checkout).",
    schema: z.enum(["flutterwave", "paystack"]),
    default: "flutterwave" as const,
  },
  otp_config: {
    label: "OTP configuration",
    description:
      "Signup verification code validity, resend window, and max sends per window.",
    schema: z.object({
      ttlSeconds: z.number().int().min(30),
      rateWindowSeconds: z.number().int().min(30),
      maxSends: z.number().int().min(1),
    }),
    default: {
      ttlSeconds: 600,
      rateWindowSeconds: 300,
      maxSends: 5,
    },
  },
} as const;

export type SettingKey = keyof typeof SETTINGS_REGISTRY;

export type SettingValue<K extends SettingKey> = z.infer<
  (typeof SETTINGS_REGISTRY)[K]["schema"]
>;
