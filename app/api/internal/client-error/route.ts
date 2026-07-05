import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message : "Unknown client error";

  logger.error("[client]", message, {
    digest: body?.digest,
    stack: body?.stack,
    path: body?.path,
  });

  return NextResponse.json({ received: true });
}
