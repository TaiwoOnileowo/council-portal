import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getAllSettings, setSetting } from "@/lib/settings";
import { SETTINGS_REGISTRY, type SettingKey } from "@/lib/settings.constant";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_KEY;
  if (!secret) return false;

  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  const secretBuf = Buffer.from(secret);
  const providedBuf = Buffer.from(provided);
  if (secretBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(secretBuf, providedBuf);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getAllSettings();
  return NextResponse.json({ data: settings });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const key = body?.key as SettingKey | undefined;

  if (!key || !Object.hasOwn(SETTINGS_REGISTRY, key)) {
    return NextResponse.json({ error: "Unknown setting key" }, { status: 400 });
  }

  const definition = SETTINGS_REGISTRY[key];
  const parsed = definition.schema.safeParse(body?.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid value" },
      { status: 400 },
    );
  }

  const saved = await setSetting(key, parsed.data as never);
  return NextResponse.json({ data: { key, value: saved } });
}
