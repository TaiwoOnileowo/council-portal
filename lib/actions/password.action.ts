"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/sendpulse";
import { cacheGet, cacheSet, cacheDel } from "@/lib/cache";

const TOKEN_TTL = 3600;
const RESET_PREFIX = "pwreset:";

export async function requestPasswordReset(email: string) {
  if (!email || !email.includes("@")) return { success: true };

  const user = await db.user.findUnique({ where: { email } });
  const vendor = !user
    ? await db.vendor.findUnique({ where: { email } })
    : null;

  if (!user && !vendor) return { success: true };

  const token = crypto.randomBytes(32).toString("hex");
  await cacheSet(`${RESET_PREFIX}${token}`, email, TOKEN_TTL);

  const firstName = user
    ? (user.name.trim().split(/\s+/)[0] ?? "Student")
    : vendor!.firstName;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cuscportal.com.ng";
  const resetUrl = `${appUrl}/new-keys?email=${encodeURIComponent(email)}&token=${token}`;

  try {
    await sendPasswordResetEmail(email, firstName, resetUrl);
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }

  return { success: true };
}

export async function verifyResetToken(token: string) {
  if (!token) return { error: "Invalid link." };

  const email = await cacheGet<string>(`${RESET_PREFIX}${token}`);
  if (!email) return { error: "This link is invalid or has expired." };

  return { email };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) return { error: "Missing required fields." };

  const email = await cacheGet<string>(`${RESET_PREFIX}${token}`);
  if (!email) return { error: "This link is invalid or has expired." };

  const user = await db.user.findUnique({ where: { email } });
  const vendor = !user
    ? await db.vendor.findUnique({ where: { email } })
    : null;

  if (!user && !vendor) return { error: "Account not found." };

  const passwordHash = await hashPassword(newPassword);

  if (user) {
    await db.user.update({ where: { email }, data: { passwordHash } });
  } else {
    await db.vendor.update({ where: { email }, data: { passwordHash } });
  }

  await cacheDel(`${RESET_PREFIX}${token}`);

  return { success: true, email };
}
