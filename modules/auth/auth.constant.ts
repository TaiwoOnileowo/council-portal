export const STUDENT_EMAIL_DOMAIN = "@stu.cu.edu.ng";

export const LEVELS = ["100", "200", "300", "400", "500"] as const;
export type LevelValue = (typeof LEVELS)[number];

export const OTP_RESEND_COOLDOWN = 60;
export const EMAIL_VERIFICATION_DEFAULT = true;

export const SIGNUP_STEP_1_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
] as const;

export const VENDOR_SIGNUP_STEP_1_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "password",
  "confirmPassword",
] as const;

export const VENDOR_SIGNUP_STEP_2_FIELDS = [
  "transportName",
  "tagline",
  "description",
  "tiktok",
  "instagram",
] as const;
export type AuthMode = "student" | "vendor";

export const AUTH_MODE: Record<
  AuthMode,
  { emailPlaceholder: string; redirect: string; gate: string }
> = {
  student: {
    emailPlaceholder: "you@stu.cu.edu.ng",
    redirect: "/",
    gate: "/gate",
  },
  vendor: {
    emailPlaceholder: "yourname@vendor.council.ng",
    redirect: "/vendor-dashboard",
    gate: "/vendor-gate",
  },
};
