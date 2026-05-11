import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendVerificationEmail } from "@/lib/sendpulse";

const OTP_TTL = 600; // 10 minutes
const RATE_WINDOW = 300;
const MAX_SENDS = 5;

function otpKey(email: string) {
  return `otp:${email}:code`;
}
function rateKey(email: string) {
  return `otp:${email}:sends`;
}

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

  const sends = await redis.get<number>(rateKey(email));
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

  await redis.setex(otpKey(email), OTP_TTL, code);

  // Increment send counter (set TTL only on first send)
  if (sends === null) {
    await redis.setex(rateKey(email), RATE_WINDOW, 1);
  } else {
    await redis.incr(rateKey(email));
  }

  try {
    await sendVerificationEmail(email, firstName, code);
  } catch (err) {
    console.error("SendPulse error:", err);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 502 },
    );
  }

  const remaining = MAX_SENDS - ((sends ?? 0) + 1);
  return NextResponse.json({
    success: true,
    remainingSends: remaining,
    fromEmail: process.env.SENDPULSE_FROM_EMAIL ?? "",
  });
}
