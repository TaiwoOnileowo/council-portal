import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const MAX_ATTEMPTS = 5;

function otpKey(email: string) {
  return `otp:${email}:code`;
}
function attemptsKey(email: string) {
  return `otp:${email}:attempts`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email: string = body?.email?.toLowerCase()?.trim() ?? "";
  const code: string = body?.code?.trim() ?? "";

  if (!email || !code) {
    return NextResponse.json({ error: "email and code are required" }, { status: 400 });
  }

  const stored = await redis.get<string>(otpKey(email));
  if (!stored) {
    return NextResponse.json(
      { error: "Code expired or not found. Please request a new one." },
      { status: 400 },
    );
  }

  const attempts = (await redis.get<number>(attemptsKey(email))) ?? 0;
  if (attempts >= MAX_ATTEMPTS) {
    // Invalidate the code
    await redis.del(otpKey(email));
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please request a new code." },
      { status: 400 },
    );
  }

  if (code !== stored) {
    const newAttempts = attempts + 1;
    const ttl = await redis.ttl(otpKey(email));
    await redis.setex(attemptsKey(email), Math.max(ttl, 1), newAttempts);

    const left = MAX_ATTEMPTS - newAttempts;
    return NextResponse.json(
      {
        error:
          left > 0
            ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.`
            : "Too many incorrect attempts. Please request a new code.",
        ...(left === 0 && { invalidated: true }),
      },
      { status: 400 },
    );
  }

  // Success — delete code and attempt counter
  await Promise.all([redis.del(otpKey(email)), redis.del(attemptsKey(email))]);
  return NextResponse.json({ success: true });
}
