"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isApprovedVendor } from "@/lib/vendorData";
import {
  vendorSignUpSchema,
  vendorSignInSchema,
  updateVendorProfileSchema,
  changeVendorPasswordSchema,
  vendorBankSchema,
} from "@/lib/validations/vendor";
import { CallbackRouteError } from "@auth/core/errors";

export async function checkVendorEmail(email: string): Promise<{ approved: boolean }> {
  return { approved: isApprovedVendor(email) };
}

export async function signUpVendor(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  image?: string;
  transportName: string;
  tagline?: string;
  description?: string;
  tiktok?: string;
  instagram?: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}) {
  const parsed = vendorSignUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (!isApprovedVendor(input.email)) {
    return { error: "This email is not approved for vendor registration." };
  }

  const existing = await db.vendor.findUnique({ where: { email: input.email } });
  if (existing) {
    return { error: "A vendor account with this email already exists." };
  }

  const existingPhone = await db.vendor.findUnique({ where: { phone: input.phone } });
  if (existingPhone) {
    return { error: "A vendor account with this phone number already exists." };
  }

  const passwordHash = await hashPassword(input.password);

  try {
    await db.vendor.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        transportName: input.transportName,
        image: input.image || null,
        tagline: input.tagline || null,
        description: input.description || null,
        tiktok: input.tiktok || null,
        instagram: input.instagram || null,
        bankCode: input.bankCode || null,
        bankName: input.bankName || null,
        accountNumber: input.accountNumber || null,
        accountName: input.accountName || null,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      return { error: "A vendor account with this email already exists." };
    }
    return { error: "Failed to create vendor account. Please try again." };
  }

  return await signInVendor({ email: input.email, password: input.password });
}

export async function signInVendor({ email, password }: { email: string; password: string }) {
  const parsed = vendorSignInSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await signIn("vendor", { email, password, redirect: false });
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof CallbackRouteError) {
      const cause = error.cause?.err;
      const message = cause instanceof Error ? cause.message : "Invalid credentials";
      return { error: message };
    }
    return { error: "Something went wrong. Please try again." };
  }
}

export async function getVendorFromDb(email: string) {
  return db.vendor.findUnique({ where: { email } });
}

export async function getVendorById(id: string) {
  return db.vendor.findUnique({ where: { id } });
}

export async function verifyVendorPassword(email: string, password: string): Promise<boolean> {
  const vendor = await db.vendor.findUnique({ where: { email } });
  if (!vendor) return false;
  return verifyPassword(password, vendor.passwordHash);
}

export async function updateVendorPersonalInfo({
  vendorId,
  firstName,
  lastName,
  email,
  phone,
}: {
  vendorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}) {
  if (firstName.trim().length < 2) return { error: "First name must be at least 2 characters" };
  if (lastName.trim().length < 2) return { error: "Last name must be at least 2 characters" };
  if (!email.includes("@")) return { error: "Please enter a valid email address" };
  if (!/^\d{11}$/.test(phone)) return { error: "Phone number must be exactly 11 digits" };

  try {
    await db.vendor.update({
      where: { id: vendorId },
      data: { firstName, lastName, email, phone },
    });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      if (msg.toLowerCase().includes("phone")) {
        return { error: "This phone number is already in use by another vendor." };
      }
      return { error: "This email is already in use by another vendor." };
    }
    return { error: "Failed to update profile. Please try again." };
  }
}

export async function updateVendorProfile({
  vendorId,
  firstName,
  lastName,
  email,
  transportName,
  tagline,
  description,
  tiktok,
  instagram,
  image,
}: {
  vendorId: string;
  firstName: string;
  lastName: string;
  email: string;
  transportName: string;
  tagline?: string;
  description?: string;
  tiktok?: string;
  instagram?: string;
  image?: string;
}) {
  const parsed = updateVendorProfileSchema.safeParse({
    firstName,
    lastName,
    email,
    transportName,
    tagline,
    description,
    tiktok,
    instagram,
    image,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.vendor.update({
      where: { id: vendorId },
      data: {
        firstName,
        lastName,
        email,
        transportName,
        tagline: tagline || null,
        description: description || null,
        tiktok: tiktok || null,
        instagram: instagram || null,
        image: image || null,
      },
    });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      return { error: "This email is already in use by another vendor." };
    }
    return { error: "Failed to update profile. Please try again." };
  }
}

export async function updateVendorBankDetails({
  vendorId,
  bankCode,
  bankName,
  accountNumber,
  accountName,
}: {
  vendorId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}) {
  const parsed = vendorBankSchema.safeParse({ bankCode, bankName, accountNumber, accountName });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.vendor.update({
      where: { id: vendorId },
      data: { bankCode, bankName, accountNumber, accountName },
    });
    return { success: true };
  } catch {
    return { error: "Failed to save bank details. Please try again." };
  }
}

export async function changeVendorPassword({
  vendorId,
  currentPassword,
  newPassword,
  confirmNewPassword,
}: {
  vendorId: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  const parsed = changeVendorPasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmNewPassword,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) return { error: "Account not found." };

  const valid = await verifyPassword(currentPassword, vendor.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await hashPassword(newPassword);
  await db.vendor.update({ where: { id: vendorId }, data: { passwordHash } });

  return { success: true };
}
