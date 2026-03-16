"use server";

import { signIn, signOut } from "@/auth";
import { Level } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  signInSchema,
  signUpSchema,
  updateProfileSchema,
} from "@/lib/validations/auth";
import { CallbackRouteError } from "@auth/core/errors";
export async function getUserFromDb(email: string) {
  return db.user.findUnique({ where: { email } });
}

export async function signInUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const parsed = signInSchema.safeParse({ email, password });
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

  const existingMatric = await db.user.findUnique({ where: { matricNumber } });
  if (existingMatric) {
    return {
      error: "This matric number is already registered",
      field: "matricNumber" as const,
    };
  }

  const passwordHash = await hashPassword(password);
  const name = `${firstName} ${lastName}`;
  const dbLevel = `L${level}` as Level;

  try {
    await db.user.create({
      data: {
        name,
        email,
        phone,
        matricNumber,
        department,
        level: dbLevel,
        passwordHash,
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

  return await signInUser({ email, password });
}

export async function updateProfile({
  userId,
  firstName,
  lastName,
  email,
  phone,
  matricNumber,
  department,
  level,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  department: string;
  level: string;
}) {
  const parsed = updateProfileSchema.safeParse({
    firstName,
    lastName,
    email,
    phone,
    matricNumber,
    department,
    level,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const dbLevel = `L${level}` as Level;

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        name: `${firstName} ${lastName}`,
        email,
        phone,
        matricNumber,
        department,
        level: dbLevel,
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

export async function signOutUser() {
  await signOut();
}
