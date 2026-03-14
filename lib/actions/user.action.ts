"use server";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";

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
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    if (message.includes("Invalid email or password")) {
      return { error: "Invalid email or password" };
    }
    return { error: message };
  }
}

export async function signUpUser({
  name,
  email,
  phone,
  matricNumber,
  password,
  confirmPassword,
}: {
  name: string;
  email: string;
  phone: string;
  matricNumber: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = signUpSchema.safeParse({
    name,
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

  await db.user.create({
    data: { name, email, phone, matricNumber, passwordHash },
  });

  return await signInUser({ email, password });
}
