import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/sendpulse";
import { cacheGet, cacheSet, cacheIncr } from "@/lib/cache";

const OTP_TTL = 600;
const RATE_WINDOW = 300;
const MAX_SENDS = 5;

const otpKey = (email: string) => `otp:${email}:code`;
const rateKey = (email: string) => `otp:${email}:sends`;

function generateCode() {
return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email: string = body?.email?.toLowerCase()?.trim() ?? "";
  const firstName: string = body?.firstName?.trim() ?? "";

  if (!email || !firstName) {
    return NextResponse.json(
      { error: "email and firstName are required" },
      { status: 400 },
    );
  }

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const sends = await cacheGet<number>(rateKey(email));
  if (sends !== null && sends >= MAX_SENDS) {
    return NextResponse.json(
      {
        error:
          "Too many codes sent. Please wait 10 minutes before trying again.",
      },
      { status: 429 },
    );
  }

  const code = generateCode();
  await cacheSet(otpKey(email), code, OTP_TTL);
  await cacheIncr(rateKey(email), RATE_WINDOW);

  try {
    await sendVerificationEmail(email, firstName, code);
  } catch (err) {
    console.error("SendPulse error:", err);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    remainingSends: MAX_SENDS - ((sends ?? 0) + 1),
    fromEmail: process.env.SENDPULSE_FROM_EMAIL ?? "",
  });
}
