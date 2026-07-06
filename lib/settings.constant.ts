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
  pricing_config: {
    label: "Pricing",
    description:
      "Commission taken from vendor earnings, minimum vendor withdrawal, and the service fee rate (capped at a max naira amount) applied to online checkout — booking payments made online and wallet top-ups. Wallet-balance booking payments stay fee-free.",
    schema: z.object({
      commissionNaira: z.number().int().min(0),
      minPayoutNaira: z.number().int().min(0),
      serviceFeeRate: z.number().min(0).max(1).default(0.02),
      serviceFeeCapNaira: z.number().int().min(0).default(1500),
    }),
    default: {
      commissionNaira: 1000,
      minPayoutNaira: 1000,
      serviceFeeRate: 0.02,
      serviceFeeCapNaira: 1500,
    },
  },
  payment_config: {
    label: "Payment configuration",
    description:
      "Which processor handles new payment attempts (top-ups, checkout); whether vendor-initiated withdrawals are enabled per processor; and whether the scheduled payout run is enabled. Withdrawals and scheduled payouts are independent — disabling on-demand withdrawal does not stop the payout cron, and vice versa. There's no separate 'split payments' toggle: checkout splits the vendor's cut at the processor whenever wallet is disabled (see isWalletEnabled) — that's the only way checkout-driven earnings can ever be paid out with no payout path live, so it can't be an independent setting without risking the two drifting out of sync.",
    schema: z.object({
      activeProcessor: z.enum(["flutterwave", "paystack"]),
      withdrawalsEnabled: z.object({
        flutterwave: z.boolean(),
        paystack: z.boolean(),
      }),
      scheduledPayoutsEnabled: z.boolean(),
    }),
    default: {
      activeProcessor: "paystack" as const,
      withdrawalsEnabled: {
        flutterwave: false,
        paystack: false,
      },
      scheduledPayoutsEnabled: false,
    },
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
