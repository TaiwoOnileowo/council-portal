export const STUDENT_EMAIL_DOMAIN = "@stu.cu.edu.ng";

export const LEVELS = ["100", "200", "300", "400", "500"] as const;
export type LevelValue = (typeof LEVELS)[number];

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
