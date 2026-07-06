import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const tag =
    typeof body?.tag === "string" ? body.tag : "[client]";
  const message =
    typeof body?.message === "string" ? body.message : "Unknown client error";

  logger.error(tag, message, {
    digest: body?.digest,
    stack: body?.stack,
    path: body?.path,
    meta: body?.meta,
  });

  return NextResponse.json({ received: true });
}
