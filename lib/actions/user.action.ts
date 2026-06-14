"use server";

import { auth, signIn, signOut } from "@/auth";
import { Level } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { AuthMode } from "@/modules/auth/auth.constant";
import {
  credentialsSchema,
  signUpSchema,
  UpdateProfileInput,
  updateStudentProfileSchema,
} from "@/modules/auth/auth.types";
import { CallbackRouteError } from "@auth/core/errors";

export async function getUserFromDb(email: string) {
  return db.user.findUnique({ where: { email } });
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { student_profile: true, vendor_profile: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: `${user.first_name} ${user.last_name}`,
    email: user.email,
    phone: user.phone,
    image: user.image,
    role: user.role,
    student: user.student_profile
      ? {
          matricNumber: user.student_profile.matric_number,
          department: user.student_profile.department,
          level: user.student_profile.level.replace("L", ""),
        }
      : null,
    vendor: user.vendor_profile
      ? {
          category: user.vendor_profile.category,
          businessName: user.vendor_profile.business_name,
          tagline: user.vendor_profile.tagline,
          description: user.vendor_profile.description,
          instagram: user.vendor_profile.instagram,
          tiktok: user.vendor_profile.tiktok,
          bankCode: user.vendor_profile.bank_code,
          bankName: user.vendor_profile.bank_name,
          accountNumber: user.vendor_profile.account_number,
          accountName: user.vendor_profile.account_name,
          isActive: user.vendor_profile.is_active,
        }
      : null,
  };
}

export async function signInWithCredentials({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const parsed = credentialsSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
    return { success: true };
  } catch (error: unknown) {
    // NextAuth v5 wraps authorize() errors in CallbackRouteError.
    // The original message lives in error.cause.err — unwrap it first.
    if (error instanceof CallbackRouteError) {
      const cause = error.cause?.err;
      const message =
        cause instanceof Error ? cause.message : "Invalid credentials";
      return { error: message };
    }
    return { error: "Something went wrong. Please try again." };
  }
}

export async function signUpUser({
  firstName,
  lastName,
  email,
  phone,
  matricNumber,
  department,
  level,
  password,
  confirmPassword,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  department: string;
  level: string;
  password: string;
  confirmPassword: string;
}): Promise<
  | { error: string; field?: "email" | "phone" | "matricNumber" }
  | { success: boolean }
> {
  const parsed = signUpSchema.safeParse({
    firstName,
    lastName,
    email,
    phone,
    matricNumber,
    department,
    level,
    password,
    confirmPassword,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) {
    return {
      error: "An account with this email already exists",
      field: "email" as const,
    };
  }

  const existingPhone = await db.user.findUnique({ where: { phone } });
  if (existingPhone) {
    return {
      error: "This phone number is already registered",
      field: "phone" as const,
    };
  }

  const existingMatric = await db.student_profile.findUnique({
    where: { matric_number: matricNumber },
  });
  if (existingMatric) {
    return {
      error: "This matric number is already registered",
      field: "matricNumber" as const,
    };
  }

  const passwordHash = await hashPassword(password);
  const dbLevel = `L${level}` as Level;

  try {
    await db.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password_hash: passwordHash,
        role: "STUDENT",
        student_profile: {
          create: {
            matric_number: matricNumber,
            department,
            level: dbLevel,
          },
        },
      },
    });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const msg = error instanceof Error ? error.message : "";
    // Prisma unique constraint violation
    if (msg.includes("Unique constraint")) {
      return {
        error:
          "An account with this email, phone, or matric number already exists",
      };
    }
    return { error: "Failed to create account. Please try again." };
  }

  return await signInWithCredentials({ email, password });
}

export async function updateProfile({
  userId,
  ...data
}: UpdateProfileInput & { userId: string }) {
  const parsed = updateStudentProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { firstName, lastName, email, phone, matricNumber, department, level } =
    parsed.data;
  const dbLevel = `L${level}` as Level;

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        student_profile: {
          update: {
            matric_number: matricNumber,
            department,
            level: dbLevel,
          },
        },
      },
    });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      return { error: "Email, phone, or matric number is already in use" };
    }
    return { error: "Failed to update profile. Please try again." };
  }
}

export async function signOutUser(redirectTo = "/gate") {
  await signOut({ redirectTo });
}

export type GateSignInResult =
  | { success: true; isAdmin: boolean; role: string }
  | { error: string; redirectTo?: string; redirectLabel?: string };

export async function signInUser({
  email,
  password,
  mode,
}: {
  email: string;
  password: string;
  mode: AuthMode;
}): Promise<GateSignInResult> {
  const parsed = credentialsSchema.safeParse({ email, password });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    include: { admin_profile: true },
  });

  if (!user || !user.password_hash)
    return { error: "Invalid email or password" };

  const isValid = await verifyPassword(
    parsed.data.password,
    user.password_hash,
  );
  if (!isValid) return { error: "Invalid email or password" };

  const isAdmin = !!user.admin_profile;

  if (mode === "student" && user.role === "VENDOR") {
    return {
      error: "This email is registered as a vendor account.",
      redirectTo: "/vendor-gate",
      redirectLabel: "Log in at Vendor Portal",
    };
  }

  if (mode === "vendor" && user.role !== "VENDOR") {
    return {
      error: "No vendor account found for this email.",
      redirectTo: isAdmin ? "/admin-gate" : "/gate",
      redirectLabel: isAdmin
        ? "Log in at Admin Portal"
        : "Log in at Student Portal",
    };
  }

  if (mode === "admin" && !isAdmin) {
    return {
      error: "This account doesn't have admin access.",
      redirectTo: user.role === "VENDOR" ? "/vendor-gate" : "/gate",
      redirectLabel:
        user.role === "VENDOR"
          ? "Log in at Vendor Portal"
          : "Log in at Student Portal",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true, isAdmin, role: user.role };
  } catch (error: unknown) {
    if (error instanceof CallbackRouteError) {
      const cause = error.cause?.err;
      const message =
        cause instanceof Error ? cause.message : "Invalid credentials";
      return { error: message };
    }
    return { error: "Something went wrong. Please try again." };
  }
}
