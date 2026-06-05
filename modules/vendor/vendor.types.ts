import { z } from "zod";

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const vendorEmailField = z.string().email("Please enter a valid email address");

export const vendorStep1Schema = z
  .object({
    firstName: z.string().min(3, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: vendorEmailField,
    phone: z
      .string()
      .regex(/^\d{11}$/, "Phone number must be exactly 11 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const vendorStep2Schema = z.object({
  transportName: z
    .string()
    .min(3, "Transport name must be at least 2 characters")
    .max(60, "Transport name must be 60 characters or less"),
  tagline: z
    .string()
    .max(80, "Tagline must be 80 characters or less")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  tiktok: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export const vendorSignUpSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: vendorEmailField,
    phone: z
      .string()
      .regex(/^\d{11}$/, "Phone number must be exactly 11 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    image: z.string().optional(),
    transportName: z
      .string()
      .min(2, "Transport name must be at least 2 characters")
      .max(60),
    tagline: z.string().max(80).optional().or(z.literal("")),
    description: z.string().max(500).optional().or(z.literal("")),
    tiktok: z
      .string()
      .url("Please enter a valid URL")
      .optional()
      .or(z.literal("")),
    instagram: z
      .string()
      .url("Please enter a valid URL")
      .optional()
      .or(z.literal("")),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const vendorSignInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateVendorPersonalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: vendorEmailField,
  phone: z
    .string()
    .regex(/^\d{11}$/, "Phone number must be exactly 11 digits"),
});

export const updateVendorProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: vendorEmailField,
  transportName: z
    .string()
    .min(2, "Transport name must be at least 2 characters")
    .max(60, "Transport name must be 60 characters or less"),
  tagline: z
    .string()
    .max(80, "Tagline must be 80 characters or less")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  tiktok: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
});

export const vendorBankSchema = z.object({
  bankCode: z.string().min(1, "Please select a bank"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, "Account number must be exactly 10 digits"),
  accountName: z.string().min(1, "Please verify your account first"),
});

export const changeVendorPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// Partial patch for a vendor account — every field optional, only the ones
// provided are validated + updated. Backs the single updateVendorProfile action.
export const updateVendorSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: vendorEmailField,
    phone: z.string().regex(/^\d{11}$/, "Phone number must be exactly 11 digits"),
    image: z.string(),
    transportName: z
      .string()
      .min(2, "Business name must be at least 2 characters")
      .max(60, "Business name must be 60 characters or less"),
    tagline: z.string().max(80, "Tagline must be 80 characters or less"),
    description: z.string().max(500, "Description must be 500 characters or less"),
    tiktok: z.string().url("Please enter a valid URL").or(z.literal("")),
    instagram: z.string().url("Please enter a valid URL").or(z.literal("")),
    bankCode: z.string(),
    bankName: z.string(),
    accountNumber: z
      .string()
      .regex(/^\d{10}$/, "Account number must be exactly 10 digits"),
    accountName: z.string(),
    isActive: z.boolean(),
  })
  .partial();

export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

// ─── Inferred types ───────────────────────────────────────────────────────────

export type VendorStep1Fields = z.infer<typeof vendorStep1Schema>;
export type VendorStep2Fields = z.infer<typeof vendorStep2Schema>;
export type VendorSignUpInput = z.infer<typeof vendorSignUpSchema>;
