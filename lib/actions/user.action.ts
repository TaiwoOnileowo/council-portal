"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";
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
    const cause =
      error instanceof CallbackRouteError ? (error.cause?.err ?? error) : null;
    const message =
      cause instanceof Error ? cause.message : "Something went wrong";

    return { error: message };
  }
}

export async function signUpUser({
  firstName,
  lastName,
  email,
  phone,
  matricNumber,
  password,
  confirmPassword,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = signUpSchema.safeParse({
    firstName,
    lastName,
    email,
    phone,
    matricNumber,
    password,
    confirmPassword,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(password);
  const name = `${firstName} ${lastName}`;

  try {
    await db.user.create({
      data: { name, email, phone, matricNumber, passwordHash },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create account";
    // Prisma unique constraint violation
    if (msg.includes("Unique constraint")) {
      return { error: "An account with this email, phone, or matric number already exists" };
    }
    return { error: msg };
  }

  return await signInUser({ email, password });
}
