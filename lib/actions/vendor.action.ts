"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isApprovedVendor } from "@/lib/vendorData";
import { vendorSignUpSchema, vendorSignInSchema } from "@/lib/validations/vendor";
import { CallbackRouteError } from "@auth/core/errors";

export async function checkVendorEmail(email: string): Promise<{ approved: boolean }> {
  return { approved: isApprovedVendor(email) };
}

export async function signUpVendor(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  image?: string;
  transportName: string;
  tagline?: string;
  description?: string;
  tiktok?: string;
  instagram?: string;
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

  const passwordHash = await hashPassword(input.password);

  try {
    await db.vendor.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        transportName: input.transportName,
        image: input.image || null,
        tagline: input.tagline || null,
        description: input.description || null,
        tiktok: input.tiktok || null,
        instagram: input.instagram || null,
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
