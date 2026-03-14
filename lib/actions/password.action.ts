"use server";

import crypto from "crypto";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/sendpulse";

const TOKEN_TTL = 3600; // 1 hour
const RESET_PREFIX = "pwreset:";

export async function requestPasswordReset(email: string) {
  if (!email || !email.includes("@")) return { success: true };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { success: true };

  const token = crypto.randomBytes(32).toString("hex");
  await redis.setex(`${RESET_PREFIX}${token}`, TOKEN_TTL, email);

  const firstName = user.name.trim().split(/\s+/)[0] ?? "Student";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const resetUrl = `${appUrl}/new-keys?email=${encodeURIComponent(email)}&token=${token}`;

  try {
    await sendPasswordResetEmail(email, firstName, resetUrl);
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    // Silently fail — don't leak error to client
  }

  return { success: true };
}

export async function verifyResetToken(token: string) {
  if (!token) return { error: "Invalid link." };

  const email = await redis.get<string>(`${RESET_PREFIX}${token}`);
  if (!email) return { error: "This link is invalid or has expired." };

  return { email };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) return { error: "Missing required fields." };

  const email = await redis.get<string>(`${RESET_PREFIX}${token}`);
  if (!email) return { error: "This link is invalid or has expired." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: "Account not found." };

  const passwordHash = await hashPassword(newPassword);

  await db.user.update({ where: { email }, data: { passwordHash } });

  // Delete token immediately — single-use
  await redis.del(`${RESET_PREFIX}${token}`);

  return { success: true, email };
}
