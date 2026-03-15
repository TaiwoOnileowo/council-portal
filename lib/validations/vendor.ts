import { z } from "zod";

const vendorEmailField = z
  .string()
  .email("Please enter a valid email address")
  .refine((v) => v.endsWith("@stu.cu.edu.ng"), {
    message: "Only @stu.cu.edu.ng email addresses are allowed",
  });

export const vendorStep1Schema = z
  .object({
    firstName: z.string().min(3, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: vendorEmailField,
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
});

export const updateVendorProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: vendorEmailField,
  transportName: z
    .string()
    .min(2, "Transport name must be at least 2 characters")
    .max(60, "Transport name must be 60 characters or less"),
  tagline: z.string().max(80, "Tagline must be 80 characters or less").optional().or(z.literal("")),
  description: z.string().max(500, "Description must be 500 characters or less").optional().or(z.literal("")),
  tiktok: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  instagram: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
});

export const changeVendorPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type VendorStep1Fields = z.infer<typeof vendorStep1Schema>;
export type VendorStep2Fields = z.infer<typeof vendorStep2Schema>;
export type VendorSignUpInput = z.infer<typeof vendorSignUpSchema>;
