import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function otpKey(email: string) {
  return `otp:${email}:code`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email: string = body?.email?.toLowerCase()?.trim() ?? "";
  const code: string = body?.code?.trim() ?? "";

  if (!email || !code) {
    return NextResponse.json(
      { error: "email and code are required" },
      { status: 400 },
    );
  }

  const stored = await redis.get<string>(otpKey(email));

  if (!stored || code !== String(stored)) {
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  await redis.del(otpKey(email));
  return NextResponse.json({ success: true });
}
