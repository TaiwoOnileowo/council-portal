"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { isApprovedVendor } from "@/modules/vendor/vendor.constants";
import { signInWithCredentials } from "@/lib/actions/user.action";
import {
  vendorSignUpSchema,
  updateVendorSchema,
  type UpdateVendorInput,
} from "@/modules/vendor/vendor.types";
import type { Prisma } from "@/generated/prisma/client";

export async function checkVendorApproval(
  email: string,
): Promise<{ approved: boolean }> {
  return { approved: await isApprovedVendor(email) };
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

  if (!(await isApprovedVendor(input.email))) {
    return { error: "This email is not approved for vendor registration." };
  }

  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const existingPhone = await db.user.findUnique({
    where: { phone: input.phone },
  });
  if (existingPhone) {
    return { error: "An account with this phone number already exists." };
  }

  const passwordHash = await hashPassword(input.password);

  try {
    await db.user.create({
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        password_hash: passwordHash,
        role: "VENDOR",
        image: input.image || null,
        vendor_profile: {
          create: {
            business_name: input.transportName,
            tagline: input.tagline || null,
            description: input.description || null,
            tiktok: input.tiktok || null,
            instagram: input.instagram || null,
            bank_code: input.bankCode || null,
            bank_name: input.bankName || null,
            account_number: input.accountNumber || null,
            account_name: input.accountName || null,
          },
        },
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      return { error: "An account with this email already exists." };
    }
    return { error: "Failed to create vendor account. Please try again." };
  }

  return await signInWithCredentials({
    email: input.email,
    password: input.password,
  });
}

export async function updateVendorProfile(input: UpdateVendorInput) {
  const session = await auth();
  if (session?.user?.role !== "VENDOR") return { error: "Unauthorized" };

  const parsed = updateVendorSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const userData: Prisma.userUpdateInput = {};
  if (data.firstName !== undefined) userData.first_name = data.firstName;
  if (data.lastName !== undefined) userData.last_name = data.lastName;
  if (data.email !== undefined) userData.email = data.email;
  if (data.phone !== undefined) userData.phone = data.phone;
  if (data.image !== undefined) userData.image = data.image || null;

  const profileData: Prisma.vendor_profileUpdateWithoutUserInput = {};
  if (data.transportName !== undefined)
    profileData.business_name = data.transportName;
  if (data.tagline !== undefined) profileData.tagline = data.tagline || null;
  if (data.description !== undefined)
    profileData.description = data.description || null;
  if (data.tiktok !== undefined) profileData.tiktok = data.tiktok || null;
  if (data.instagram !== undefined)
    profileData.instagram = data.instagram || null;
  if (data.bankCode !== undefined)
    profileData.bank_code = data.bankCode || null;
  if (data.bankName !== undefined)
    profileData.bank_name = data.bankName || null;
  if (data.accountNumber !== undefined)
    profileData.account_number = data.accountNumber || null;
  if (data.accountName !== undefined)
    profileData.account_name = data.accountName || null;
  if (data.isActive !== undefined) profileData.is_active = data.isActive;

  if (Object.keys(profileData).length > 0) {
    userData.vendor_profile = { update: profileData };
  }

  try {
    await db.user.update({ where: { id: session.user.id }, data: userData });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      if (msg.toLowerCase().includes("phone")) {
        return {
          error: "This phone number is already in use by another account.",
        };
      }
      return { error: "This email is already in use by another account." };
    }
    return { error: "Failed to update profile. Please try again." };
  }
}
